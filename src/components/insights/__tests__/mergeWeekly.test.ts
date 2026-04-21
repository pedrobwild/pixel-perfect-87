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
    //   MERGE_WEEKLY_PERF_BUDGET_MS   hard ceiling for total optimized runtime
    //                                  across all RUNS iterations (default 1500)
    //   MERGE_WEEKLY_PERF_RATIO       minimum naive/optimized speedup ratio
    //                                  (default 1.2 — non-flaky, still catches
    //                                  a regression back to O(W·B·P) which is
    //                                  typically 5–15× slower here)
    //   MERGE_WEEKLY_PERF_RUNS        iteration count (default 20)
    //   CI=true                       auto-relaxes defaults (2× budget, 1.05×
    //                                  ratio floor) when no explicit overrides
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

    // CI defaults: more permissive to tolerate shared-runner jitter.
    const defaultBudgetMs = isCI ? 3000 : 1500;
    const defaultRatio = isCI ? 1.05 : 1.2;
    const defaultRuns = 20;

    const budgetMs = num("MERGE_WEEKLY_PERF_BUDGET_MS", defaultBudgetMs);
    const minRatio = num("MERGE_WEEKLY_PERF_RATIO", defaultRatio);
    const RUNS = Math.max(1, Math.round(num("MERGE_WEEKLY_PERF_RUNS", defaultRuns)));

    // Bigger W and B so the per-row Array.find cost (O(P) per broker) actually
    // dominates and the algorithmic win shows above measurement noise.
    const series = makeSeries(800, 12);

    // Warm-up to stabilize JIT and avoid first-call skew.
    mergeWeekly(series);
    mergeWeeklyNaive(series);

    const t0 = performance.now();
    for (let i = 0; i < RUNS; i++) mergeWeekly(series);
    const optimized = performance.now() - t0;

    const t1 = performance.now();
    for (let i = 0; i < RUNS; i++) mergeWeeklyNaive(series);
    const naive = performance.now() - t1;

    const ratio = naive / optimized;
    const requiredOptimizedMaxMs = naive / minRatio;

    // Single, copy-pasteable diagnostic block. Used as the message for BOTH
    // assertions so a failed CI run surfaces the exact timings, the active
    // thresholds, and the env knobs needed to reproduce or relax the budget.
    const diagnostics = [
      "",
      "  ── mergeWeekly perf diagnostics ──",
      `  RUNS                       : ${RUNS}`,
      `  optimized total            : ${optimized.toFixed(2)} ms  (avg ${(optimized / RUNS).toFixed(3)} ms/run)`,
      `  naive total                : ${naive.toFixed(2)} ms  (avg ${(naive / RUNS).toFixed(3)} ms/run)`,
      `  speedup (naive/optimized)  : ${ratio.toFixed(2)}×`,
      "  ── thresholds ──",
      `  budget ceiling             : ${budgetMs} ms  ${optimized < budgetMs ? "✓" : "✗"} (optimized=${optimized.toFixed(2)} ms)`,
      `  required min speedup       : ${minRatio.toFixed(2)}×  (optimized must be < ${requiredOptimizedMaxMs.toFixed(2)} ms)  ${optimized < requiredOptimizedMaxMs ? "✓" : "✗"}`,
      `  environment                : CI=${isCI} (defaults: budget=${defaultBudgetMs}ms, ratio=${defaultRatio}×)`,
      "  ── overrides ──",
      "  MERGE_WEEKLY_PERF_BUDGET_MS  raise budget ceiling (ms)",
      "  MERGE_WEEKLY_PERF_RATIO      lower required speedup (e.g. 1.05)",
      "  MERGE_WEEKLY_PERF_RUNS       change iteration count",
      "",
    ].join("\n");

    // Always emit on VERBOSE so trends can be tracked across green runs too.
    if (env.VERBOSE === "1" || env.VERBOSE === "true") {
      // eslint-disable-next-line no-console
      console.log(diagnostics);
    }

    // Hard ceiling so the test fails loudly if a regression makes it quadratic again.
    expect(optimized, diagnostics).toBeLessThan(budgetMs);

    // Optimized must be measurably faster than naïve. The ratio floor catches
    // a real regression back to the O(W·B·P) implementation while staying
    // non-flaky under load.
    expect(optimized, diagnostics).toBeLessThan(requiredOptimizedMaxMs);
  });
});
