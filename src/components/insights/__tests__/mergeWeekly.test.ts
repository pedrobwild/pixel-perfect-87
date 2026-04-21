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
    // Bigger W and B so the per-row Array.find cost (O(P) per broker) actually
    // dominates and the algorithmic win shows above measurement noise.
    const series = makeSeries(800, 12);
    const RUNS = 20;

    // Warm-up to stabilize JIT and avoid first-call skew.
    mergeWeekly(series);
    mergeWeeklyNaive(series);

    const t0 = performance.now();
    for (let i = 0; i < RUNS; i++) mergeWeekly(series);
    const optimized = performance.now() - t0;

    const t1 = performance.now();
    for (let i = 0; i < RUNS; i++) mergeWeeklyNaive(series);
    const naive = performance.now() - t1;

    // Hard ceiling so the test fails loudly if a regression makes it quadratic again.
    expect(optimized).toBeLessThan(1500); // ms across all runs (jsdom is slow)
    // Optimized must be measurably faster than naïve. 1.2× keeps the test
    // non-flaky on noisy CI runners while still catching a real regression
    // back to the O(W·B·P) implementation (which is typically 5-15× slower here).
    expect(optimized).toBeLessThan(naive / 1.2);
  });
});
