import { describe, it, expect } from "vitest";
import { mergeWeekly, type BrokerSeries, type MergedRow } from "../MultiBrokerWeeklySparkline";

// ─── Reference: naïve O(W·B·Pmax) implementation kept in lock-step with the
// production one, used as a correctness oracle for the optimized version. ───
function mergeWeeklyNaive(series: BrokerSeries[]): MergedRow[] {
  const allKeys = new Set<string>();
  const labelByKey = new Map<string, string>();
  for (const s of series) {
    for (const w of s.weekly ?? []) {
      allKeys.add(w.weekStart);
      labelByKey.set(w.weekStart, w.label);
    }
  }
  const sortedKeys = Array.from(allKeys).sort();
  return sortedKeys.map((weekStart) => {
    const row: MergedRow = { weekStart, label: labelByKey.get(weekStart) ?? weekStart };
    series.forEach((s, idx) => {
      const point = s.weekly?.find((w) => w.weekStart === weekStart);
      if (!point || point.meetings === 0) {
        row[`meetings_${idx}`] = point ? point.meetings : null;
        row[`avgScore_${idx}`] = null;
      } else {
        row[`meetings_${idx}`] = point.meetings;
        row[`avgScore_${idx}`] = point.avgScore;
      }
    });
    return row;
  });
}

// Deterministic dataset generator. Each broker covers a different (overlapping)
// slice of weeks so we exercise both the alignment logic and the null-fill path.
function makeSeries(weeks: number, brokers: number): BrokerSeries[] {
  const baseDate = new Date("2025-01-06T00:00:00Z").getTime(); // Monday
  const weekKey = (i: number) => {
    const d = new Date(baseDate + i * 7 * 24 * 60 * 60 * 1000);
    return {
      weekStart: d.toISOString().slice(0, 10),
      label: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    };
  };
  return Array.from({ length: brokers }, (_, b) => {
    // Each broker skips ~10% of weeks (different ones per broker via mod) to
    // create realistic gaps that exercise the connectNulls path.
    const weekly = [];
    for (let i = 0; i < weeks; i++) {
      if ((i + b) % 10 === 0) continue; // gap
      const { weekStart, label } = weekKey(i);
      // Some weeks intentionally have 0 meetings to verify the score=null guard.
      const meetings = (i + b) % 7 === 0 ? 0 : 1 + ((i * (b + 1)) % 9);
      const avgScore = meetings === 0 ? 0 : 40 + ((i * 13 + b * 7) % 60);
      weekly.push({ weekStart, label, meetings, avgScore });
    }
    return { name: `Broker ${b + 1}`, weekly };
  });
}

describe("mergeWeekly", () => {
  it("matches the naïve implementation exactly on a small dataset", () => {
    const series = makeSeries(12, 2);
    expect(mergeWeekly(series)).toEqual(mergeWeeklyNaive(series));
  });

  it("matches the naïve implementation on a large, gap-heavy dataset", () => {
    const series = makeSeries(200, 6);
    expect(mergeWeekly(series)).toEqual(mergeWeeklyNaive(series));
  });

  it("nulls out avgScore (but keeps meetings) when meetings === 0", () => {
    const series: BrokerSeries[] = [
      {
        name: "A",
        weekly: [
          { weekStart: "2025-01-06", label: "06/01", meetings: 0, avgScore: 88 },
          { weekStart: "2025-01-13", label: "13/01", meetings: 3, avgScore: 70 },
        ],
      },
    ];
    const [w0, w1] = mergeWeekly(series);
    expect(w0.meetings_0).toBe(0);
    expect(w0.avgScore_0).toBeNull();
    expect(w1.meetings_0).toBe(3);
    expect(w1.avgScore_0).toBe(70);
  });

  it("handles brokers with undefined/empty weekly arrays without throwing", () => {
    const series: BrokerSeries[] = [
      { name: "A", weekly: undefined },
      { name: "B", weekly: [] },
      {
        name: "C",
        weekly: [{ weekStart: "2025-02-03", label: "03/02", meetings: 4, avgScore: 80 }],
      },
    ];
    const rows = mergeWeekly(series);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      weekStart: "2025-02-03",
      label: "03/02",
      meetings_0: null,
      avgScore_0: null,
      meetings_1: null,
      avgScore_1: null,
      meetings_2: 4,
      avgScore_2: 80,
    });
  });

  it("is faster than the naïve O(W·B·P) implementation on a large dataset", () => {
    // ─── Configurable thresholds ────────────────────────────────────────────
    // Override per-environment via env vars to absorb slow/noisy CI runners
    // without weakening the regression signal locally.
    //
    //   MERGE_WEEKLY_PERF_BUDGET_MS    hard per-run ceiling for optimized impl
    //                                   (median ms per single mergeWeekly call;
    //                                   default 75ms local / 200ms on CI)
    //   MERGE_WEEKLY_PERF_RATIO        minimum naive/optimized speedup ratio,
    //                                   computed on medians (default 1.2 local
    //                                   / 1.05 CI). Median + RSE gating make
    //                                   1.2× safe even under modest jitter.
    //   MERGE_WEEKLY_PERF_MIN_RUNS     minimum iterations before adaptive
    //                                   stopping is allowed (default 12)
    //   MERGE_WEEKLY_PERF_MAX_RUNS     hard cap on iterations (default 80)
    //   MERGE_WEEKLY_PERF_TARGET_RSE   relative standard error of the mean we
    //                                   consider "stable" (default 0.05 = 5%)
    //   CI=true                         auto-relaxes defaults
    //
    // Reading process.env directly keeps this dependency-free and works in
    // both Node and Vitest's jsdom environment.
    const env = (typeof process !== "undefined" ? process.env : {}) ?? {};
    const isCI = env.CI === "true" || env.CI === "1";

    const num = (key: string, fallback: number): number => {
      const raw = env[key];
      if (!raw) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };

    // CI defaults: per-run budget + slightly higher RSE tolerance, more runs.
    const defaultBudgetMs = isCI ? 200 : 75;
    const defaultRatio = isCI ? 1.05 : 1.2;
    const defaultMinRuns = 12;
    const defaultMaxRuns = isCI ? 120 : 80;
    const defaultTargetRSE = isCI ? 0.07 : 0.05;

    const budgetMs = num("MERGE_WEEKLY_PERF_BUDGET_MS", defaultBudgetMs);
    const minRatio = num("MERGE_WEEKLY_PERF_RATIO", defaultRatio);
    const minRuns = Math.max(3, Math.round(num("MERGE_WEEKLY_PERF_MIN_RUNS", defaultMinRuns)));
    const maxRuns = Math.max(minRuns, Math.round(num("MERGE_WEEKLY_PERF_MAX_RUNS", defaultMaxRuns)));
    const targetRSE = num("MERGE_WEEKLY_PERF_TARGET_RSE", defaultTargetRSE);

    // Bigger W and B so the per-row Array.find cost (O(P) per broker) actually
    // dominates and the algorithmic win shows above measurement noise.
    const series = makeSeries(800, 12);

    // ─── Stats helpers ────────────────────────────────────────────────────────
    const median = (xs: number[]): number => {
      const s = [...xs].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    const stdev = (xs: number[]): number => {
      if (xs.length < 2) return 0;
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      const variance =
        xs.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (xs.length - 1);
      return Math.sqrt(variance);
    };
    // Relative standard error of the mean — a unitless stability measure.
    // SEM = stdev/√n; RSE = SEM/mean. Drops as we collect more samples or as
    // the underlying distribution tightens.
    const rse = (xs: number[]): number => {
      if (xs.length < 2) return Infinity;
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      if (mean === 0) return Infinity;
      return stdev(xs) / Math.sqrt(xs.length) / mean;
    };

    // Adaptive sampler: collect per-call timings until BOTH series have
    // RSE ≤ targetRSE (with at least minRuns each), or maxRuns is reached.
    // Interleaving the two impls per iteration keeps any transient CPU jitter
    // (GC pause, OS scheduler hiccup) symmetric across both samples so the
    // ratio remains meaningful even on noisy runners.
    const adaptiveSample = () => {
      const opt: number[] = [];
      const nai: number[] = [];

      // Warm-up: stabilize JIT before recording samples.
      for (let i = 0; i < 3; i++) {
        mergeWeekly(series);
        mergeWeeklyNaive(series);
      }

      let iters = 0;
      let stoppedEarly = false;
      while (iters < maxRuns) {
        const a0 = performance.now();
        mergeWeekly(series);
        opt.push(performance.now() - a0);

        const b0 = performance.now();
        mergeWeeklyNaive(series);
        nai.push(performance.now() - b0);

        iters++;
        if (
          iters >= minRuns &&
          rse(opt) <= targetRSE &&
          rse(nai) <= targetRSE
        ) {
          stoppedEarly = true;
          break;
        }
      }
      return { opt, nai, iters, stoppedEarly };
    };

    const { opt, nai, iters, stoppedEarly } = adaptiveSample();

    // Use medians for the assertion. Median is robust to single-iteration
    // outliers (GC pause, OS preemption) that would skew a mean — exactly
    // the kind of noise that causes flaky CI failures.
    const optMedian = median(opt);
    const naiMedian = median(nai);
    const optRSE = rse(opt);
    const naiRSE = rse(nai);
    const ratio = naiMedian / optMedian;
    const requiredOptimizedMaxMs = naiMedian / minRatio;

    const fmtMs = (n: number) => `${n.toFixed(3)} ms`;
    const fmtPct = (n: number) =>
      Number.isFinite(n) ? `${(n * 100).toFixed(2)}%` : "n/a";

    // Single, copy-pasteable diagnostic block. Used as the message for BOTH
    // assertions so a failed CI run surfaces the exact timings, the active
    // thresholds, and the env knobs needed to reproduce or relax the budget.
    const diagnostics = [
      "",
      "  ── mergeWeekly adaptive perf diagnostics ──",
      `  iterations                 : ${iters} (min=${minRuns}, max=${maxRuns}, stoppedEarly=${stoppedEarly})`,
      `  optimized median           : ${fmtMs(optMedian)}  RSE=${fmtPct(optRSE)}  min=${fmtMs(Math.min(...opt))}  max=${fmtMs(Math.max(...opt))}`,
      `  naive median               : ${fmtMs(naiMedian)}  RSE=${fmtPct(naiRSE)}  min=${fmtMs(Math.min(...nai))}  max=${fmtMs(Math.max(...nai))}`,
      `  speedup (naive/optimized)  : ${ratio.toFixed(2)}×  (median-based)`,
      "  ── thresholds ──",
      `  per-run budget             : ${budgetMs} ms  ${optMedian < budgetMs ? "✓" : "✗"} (optimized median=${fmtMs(optMedian)})`,
      `  required min speedup       : ${minRatio.toFixed(2)}×  (optimized median must be < ${fmtMs(requiredOptimizedMaxMs)})  ${optMedian < requiredOptimizedMaxMs ? "✓" : "✗"}`,
      `  target RSE                 : ${fmtPct(targetRSE)}  (opt=${fmtPct(optRSE)} ${optRSE <= targetRSE ? "✓" : "✗"}, naive=${fmtPct(naiRSE)} ${naiRSE <= targetRSE ? "✓" : "✗"})`,
      `  environment                : CI=${isCI} (defaults: budget=${defaultBudgetMs}ms, ratio=${defaultRatio}×, RSE=${(defaultTargetRSE * 100).toFixed(0)}%, runs=${defaultMinRuns}–${defaultMaxRuns})`,
      "  ── overrides ──",
      "  MERGE_WEEKLY_PERF_BUDGET_MS   per-run ceiling (ms)",
      "  MERGE_WEEKLY_PERF_RATIO       required min speedup (e.g. 1.05)",
      "  MERGE_WEEKLY_PERF_MIN_RUNS    floor on iterations before stopping",
      "  MERGE_WEEKLY_PERF_MAX_RUNS    hard cap on iterations",
      "  MERGE_WEEKLY_PERF_TARGET_RSE  stability target (0.05 = 5%)",
      "",
    ].join("\n");

    // Always emit on VERBOSE so trends can be tracked across green runs too.
    if (env.VERBOSE === "1" || env.VERBOSE === "true") {
      // eslint-disable-next-line no-console
      console.log(diagnostics);
    }

    // Hard per-run ceiling: catches algorithmic regressions even if the naïve
    // baseline also slows down (e.g., if both got worse together).
    expect(optMedian, diagnostics).toBeLessThan(budgetMs);

    // Median-based speedup gate: catches a true regression back to O(W·B·P)
    // while being insensitive to the per-iteration jitter that broke the old
    // sum-of-runs comparison on noisy CI.
    expect(optMedian, diagnostics).toBeLessThan(requiredOptimizedMaxMs);
  });
});
