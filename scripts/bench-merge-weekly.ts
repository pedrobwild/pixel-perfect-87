/**
 * Local micro-benchmark for `mergeWeekly`.
 *
 * Run:
 *   npm run bench:merge-weekly
 *   # or directly:
 *   npx tsx scripts/bench-merge-weekly.ts
 *
 * Optional env vars:
 *   BENCH_RUNS=50            iterations per scenario (default 30)
 *   BENCH_WEEKS=800          weeks per series (default 800)
 *   BENCH_BROKERS=12         number of brokers (default 12)
 *   BENCH_GAP_MOD=10         every Nth week is a gap per broker (default 10)
 *
 * Reports per-iteration timing (avg / p50 / p95 / min / max), throughput,
 * the optimized-vs-naive speedup ratio, and the resulting dataset size so
 * regressions in either runtime OR output shape are obvious at a glance.
 */
import {
  mergeWeekly,
  type BrokerSeries,
} from "../src/components/insights/MultiBrokerWeeklySparkline";

// ─── Naïve reference (kept in lock-step with tests) ─────────────────────────
function mergeWeeklyNaive(series: BrokerSeries[]) {
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
    const row: Record<string, string | number | null> = {
      weekStart,
      label: labelByKey.get(weekStart) ?? weekStart,
    };
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

// ─── Deterministic dataset generator ────────────────────────────────────────
function makeSeries(weeks: number, brokers: number, gapMod: number): BrokerSeries[] {
  const baseDate = new Date("2025-01-06T00:00:00Z").getTime();
  const weekKey = (i: number) => {
    const d = new Date(baseDate + i * 7 * 24 * 60 * 60 * 1000);
    return {
      weekStart: d.toISOString().slice(0, 10),
      label: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    };
  };
  return Array.from({ length: brokers }, (_, b) => {
    const weekly = [];
    for (let i = 0; i < weeks; i++) {
      if ((i + b) % gapMod === 0) continue;
      const { weekStart, label } = weekKey(i);
      const meetings = (i + b) % 7 === 0 ? 0 : 1 + ((i * (b + 1)) % 9);
      const avgScore = meetings === 0 ? 0 : 40 + ((i * 13 + b * 7) % 60);
      weekly.push({ weekStart, label, meetings, avgScore });
    }
    return { name: `Broker ${b + 1}`, weekly };
  });
}

// ─── Stats helpers ─────────────────────────────────────────────────────────
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function summarize(label: string, samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  const avg = sum / samples.length;
  return {
    label,
    runs: samples.length,
    totalMs: sum,
    avgMs: avg,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    opsPerSec: 1000 / avg,
  };
}

function fmt(n: number, digits = 2): string {
  return n.toFixed(digits).padStart(8);
}

function printTable(rows: ReturnType<typeof summarize>[]) {
  console.log(
    "  " +
      ["impl", "runs", "avg ms", "p50 ms", "p95 ms", "min ms", "max ms", "ops/s"]
        .map((h) => h.padStart(h === "impl" ? 12 : 8))
        .join("  ")
  );
  for (const r of rows) {
    console.log(
      "  " +
        [
          r.label.padStart(12),
          String(r.runs).padStart(8),
          fmt(r.avgMs),
          fmt(r.p50Ms),
          fmt(r.p95Ms),
          fmt(r.minMs),
          fmt(r.maxMs),
          fmt(r.opsPerSec, 1),
        ].join("  ")
    );
  }
}

// ─── Bench runner ──────────────────────────────────────────────────────────
function bench(label: string, fn: () => unknown, runs: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return samples;
}

function approxBytes(value: unknown): number {
  // Rough JSON-serialized size — good enough to flag a shape regression.
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function main() {
  const RUNS = Math.max(1, Math.round(num("BENCH_RUNS", 30)));
  const WEEKS = Math.max(1, Math.round(num("BENCH_WEEKS", 800)));
  const BROKERS = Math.max(1, Math.round(num("BENCH_BROKERS", 12)));
  const GAP_MOD = Math.max(2, Math.round(num("BENCH_GAP_MOD", 10)));

  // Pass/fail thresholds — match the test suite defaults so a green bench
  // implies a green test (large bucket). Override via env to mirror CI.
  const BUDGET_MS = num("BENCH_BUDGET_MS", 75); // per-call median ceiling
  const MIN_RATIO = num("BENCH_MIN_RATIO", 1.2); // naive/optimized speedup

  console.log("\n▶ mergeWeekly micro-benchmark");
  console.log(`  config: weeks=${WEEKS}  brokers=${BROKERS}  gapMod=${GAP_MOD}  runs=${RUNS}`);
  console.log(`  thresholds: budget=${BUDGET_MS}ms/call  minSpeedup=${MIN_RATIO.toFixed(2)}×`);
  console.log(`  node:   ${process.version}  platform=${process.platform}/${process.arch}\n`);

  const series = makeSeries(WEEKS, BROKERS, GAP_MOD);

  // Warm-up: stabilize JIT before timing.
  for (let i = 0; i < 3; i++) {
    mergeWeekly(series);
    mergeWeeklyNaive(series);
  }

  // Output-shape sanity check + sizing.
  const optimizedOut = mergeWeekly(series);
  const naiveOut = mergeWeeklyNaive(series);
  const rows = optimizedOut.length;
  const colsPerRow = rows > 0 ? Object.keys(optimizedOut[0]).length : 0;
  const optimizedBytes = approxBytes(optimizedOut);
  const naiveBytes = approxBytes(naiveOut);
  const shapeMatches =
    rows === naiveOut.length && optimizedBytes === naiveBytes;

  console.log("  output:");
  console.log(`    rows           : ${rows}`);
  console.log(`    cols/row       : ${colsPerRow}`);
  console.log(`    json bytes (opt): ${optimizedBytes.toLocaleString()}`);
  console.log(`    json bytes (nai): ${naiveBytes.toLocaleString()}`);
  console.log(
    `    shape match    : ${shapeMatches ? "✓ identical" : "✗ DIVERGED — investigate"}`
  );
  console.log("");

  const optSamples = bench("optimized", () => mergeWeekly(series), RUNS);
  const naiSamples = bench("naive", () => mergeWeeklyNaive(series), RUNS);

  const opt = summarize("optimized", optSamples);
  const nai = summarize("naive", naiSamples);

  console.log("  timing:");
  printTable([opt, nai]);

  // Use median for thresholds — matches the test suite, robust to outliers.
  const optMedian = opt.p50Ms;
  const naiMedian = nai.p50Ms;
  const ratio = nai.avgMs / opt.avgMs;
  const ratioMedian = naiMedian / optMedian;
  const requiredOptMaxMs = naiMedian / MIN_RATIO;

  // ─── Pass/fail evaluation ───────────────────────────────────────────────
  const failures: string[] = [];
  if (!shapeMatches) failures.push("output shape diverged from naive");
  if (optMedian >= BUDGET_MS) {
    failures.push(
      `optimized median ${optMedian.toFixed(3)}ms ≥ budget ${BUDGET_MS}ms`
    );
  }
  if (ratioMedian < MIN_RATIO) {
    failures.push(
      `median speedup ${ratioMedian.toFixed(2)}× < required ${MIN_RATIO.toFixed(2)}×`
    );
  }
  const failed = failures.length > 0;

  console.log("");
  console.log(`  speedup (avg)  : ${ratio.toFixed(2)}×  |  median: ${ratioMedian.toFixed(2)}×`);

  // VERBOSE controls whether the full diagnostic block is also printed when
  // the bench passes. The same block is always printed (to stderr) on failure.
  const VERBOSE = process.env.VERBOSE === "1" || process.env.VERBOSE === "true";

  // Shared report builder — identical content for pass+VERBOSE and failure
  // paths so a green VERBOSE run is directly comparable to a red CI log.
  const buildReport = (kind: "pass" | "fail"): string[] => {
    const lines: string[] = [""];
    if (kind === "fail") {
      lines.push(
        "  ╔══════════════════════════════════════════════════════════════╗",
        "  ║  ✗ REGRESSION DETECTED — mergeWeekly benchmark failed        ║",
        "  ╚══════════════════════════════════════════════════════════════╝",
        ""
      );
    } else {
      lines.push(
        "  ── verbose diagnostics (VERBOSE=1) ──",
        ""
      );
    }
    lines.push(
      "  measured:",
      `    optimized   median=${optMedian.toFixed(3)}ms  avg=${opt.avgMs.toFixed(3)}ms  p95=${opt.p95Ms.toFixed(3)}ms  min=${opt.minMs.toFixed(3)}ms  max=${opt.maxMs.toFixed(3)}ms`,
      `    naive       median=${naiMedian.toFixed(3)}ms  avg=${nai.avgMs.toFixed(3)}ms  p95=${nai.p95Ms.toFixed(3)}ms  min=${nai.minMs.toFixed(3)}ms  max=${nai.maxMs.toFixed(3)}ms`,
      `    speedup     median=${ratioMedian.toFixed(2)}×   avg=${ratio.toFixed(2)}×`,
      `    output      ${shapeMatches ? "shape OK" : "✗ DIVERGED — opt=" + optimizedBytes + "B vs nai=" + naiveBytes + "B"}`,
      "",
      "  thresholds (computed):",
      `    budget ceiling          : ${BUDGET_MS} ms/call  ${optMedian < BUDGET_MS ? "✓" : "✗"}  (override: BENCH_BUDGET_MS)`,
      `    required min speedup    : ${MIN_RATIO.toFixed(2)}×  → optimized median must be < ${requiredOptMaxMs.toFixed(3)} ms  ${optMedian < requiredOptMaxMs ? "✓" : "✗"}  (override: BENCH_MIN_RATIO)`,
      `    output shape parity     : required identical to naive  ${shapeMatches ? "✓" : "✗"}`,
      "",
      "  overrides:",
      "    BENCH_RUNS         iterations per impl (default 30)",
      "    BENCH_WEEKS        weeks per series (default 800)",
      "    BENCH_BROKERS      number of brokers (default 12)",
      "    BENCH_GAP_MOD      every Nth week is a gap per broker (default 10)",
      "    BENCH_BUDGET_MS    per-call median ceiling (default 75)",
      "    BENCH_MIN_RATIO    required naive/optimized speedup (default 1.2)",
      "    VERBOSE=1          always print this block, even when green",
      ""
    );
    if (kind === "fail") {
      lines.push(
        "  failures:",
        ...failures.map((f) => `    ✗ ${f}`),
        "",
        "  reproduce / tune:",
        `    BENCH_RUNS=${RUNS} BENCH_WEEKS=${WEEKS} BENCH_BROKERS=${BROKERS} BENCH_GAP_MOD=${GAP_MOD} \\`,
        `      BENCH_BUDGET_MS=${BUDGET_MS} BENCH_MIN_RATIO=${MIN_RATIO} npm run bench:merge-weekly`,
        ""
      );
    }
    return lines;
  };

  if (failed) {
    // Detailed regression report — stderr so CI logs and pre-push hooks
    // surface the exact numbers + thresholds prominently.
    for (const line of buildReport("fail")) console.error(line);
    process.exit(1);
  }

  if (VERBOSE) {
    for (const line of buildReport("pass")) console.log(line);
  }

  console.log(
    `  verdict        : ✓ healthy (median ${optMedian.toFixed(2)}ms < ${BUDGET_MS}ms budget, ${ratioMedian.toFixed(2)}× ≥ ${MIN_RATIO}× required)\n`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
