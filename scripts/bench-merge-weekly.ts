/**
 * Local micro-benchmark for `mergeWeekly`.
 *
 * Run:
 *   npm run bench:merge-weekly
 *   # or directly:
 *   npx tsx scripts/bench-merge-weekly.ts [--json[=path]]
 *
 * Optional CLI flags:
 *   --json              write JSON artifact to ./bench-results/merge-weekly-<ts>.json
 *   --json=<path>       write JSON artifact to <path>
 *
 * Optional env vars:
 *   BENCH_RUNS=50            iterations per scenario (default 30)
 *   BENCH_WEEKS=800          weeks per series (default 800)
 *   BENCH_BROKERS=12         number of brokers (default 12)
 *   BENCH_GAP_MOD=10         every Nth week is a gap per broker (default 10)
 *   BENCH_BUDGET_MS=75       per-call median ceiling (ms)
 *   BENCH_MIN_RATIO=1.2      required naive/optimized speedup
 *   BENCH_JSON=<path>        same as --json=<path>
 *   VERBOSE=1                always print full diagnostic block
 *
 * Reports per-iteration timing (avg / p50 / p95 / min / max), throughput,
 * the optimized-vs-naive speedup ratio, and the resulting dataset size so
 * regressions in either runtime OR output shape are obvious at a glance.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
  // ─── CLI parsing ────────────────────────────────────────────────────────
  // Supports `--json` (default path) or `--json=<path>` (custom path).
  // Env var BENCH_JSON works the same way for non-interactive use (e.g. CI).
  // The artifact contains every field needed to compare runs over time:
  // config, env snapshot, raw + summary timings, computed thresholds, verdict.
  const argv = process.argv.slice(2);
  let jsonPath: string | null = null;
  for (const arg of argv) {
    if (arg === "--json") jsonPath = "default";
    else if (arg.startsWith("--json=")) jsonPath = arg.slice("--json=".length).trim() || "default";
    else if (arg === "-h" || arg === "--help") {
      console.log("Usage: tsx scripts/bench-merge-weekly.ts [--json[=path]]");
      console.log("Env: BENCH_RUNS, BENCH_WEEKS, BENCH_BROKERS, BENCH_GAP_MOD,");
      console.log("     BENCH_BUDGET_MS, BENCH_MIN_RATIO, BENCH_JSON, VERBOSE=1");
      process.exit(0);
    }
  }
  if (!jsonPath && process.env.BENCH_JSON) {
    jsonPath = process.env.BENCH_JSON.trim() || "default";
  }

  const RUNS = Math.max(1, Math.round(num("BENCH_RUNS", 30)));
  const WEEKS = Math.max(1, Math.round(num("BENCH_WEEKS", 800)));
  const BROKERS = Math.max(1, Math.round(num("BENCH_BROKERS", 12)));
  const GAP_MOD = Math.max(2, Math.round(num("BENCH_GAP_MOD", 10)));

  // Pass/fail thresholds — match the test suite defaults so a green bench
  // implies a green test (large bucket). Override via env to mirror CI.
  const BUDGET_MS = num("BENCH_BUDGET_MS", 75); // per-call median ceiling
  const MIN_RATIO = num("BENCH_MIN_RATIO", 1.2); // naive/optimized speedup

  // ─── Env snapshot ─────────────────────────────────────────────────────────
  // Capture the EXACT effective value of every knob the bench AND the
  // companion vitest perf suite recognize, plus whether each one was
  // explicitly set or defaulted. Reused in the diagnostics block and to
  // build a one-line reproduce command.
  const trackedEnv = [
    // Bench-only knobs (with their effective parsed values).
    { key: "BENCH_RUNS", effective: String(RUNS), default: "30" },
    { key: "BENCH_WEEKS", effective: String(WEEKS), default: "800" },
    { key: "BENCH_BROKERS", effective: String(BROKERS), default: "12" },
    { key: "BENCH_GAP_MOD", effective: String(GAP_MOD), default: "10" },
    { key: "BENCH_BUDGET_MS", effective: String(BUDGET_MS), default: "75" },
    { key: "BENCH_MIN_RATIO", effective: MIN_RATIO.toFixed(2), default: "1.20" },
    // Cross-cutting knobs that influence the related vitest perf suite —
    // shown here so a single snapshot reproduces both.
    { key: "CI", effective: process.env.CI ?? "(unset)", default: "(unset)" },
    { key: "VERBOSE", effective: process.env.VERBOSE ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_BUDGET_MS", effective: process.env.MERGE_WEEKLY_PERF_BUDGET_MS ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_RATIO", effective: process.env.MERGE_WEEKLY_PERF_RATIO ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_MIN_RUNS", effective: process.env.MERGE_WEEKLY_PERF_MIN_RUNS ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_MAX_RUNS", effective: process.env.MERGE_WEEKLY_PERF_MAX_RUNS ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_TARGET_RSE", effective: process.env.MERGE_WEEKLY_PERF_TARGET_RSE ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_BUDGET_MS_SMALL", effective: process.env.MERGE_WEEKLY_PERF_BUDGET_MS_SMALL ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_BUDGET_MS_MEDIUM", effective: process.env.MERGE_WEEKLY_PERF_BUDGET_MS_MEDIUM ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_BUDGET_MS_LARGE", effective: process.env.MERGE_WEEKLY_PERF_BUDGET_MS_LARGE ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_RATIO_SMALL", effective: process.env.MERGE_WEEKLY_PERF_RATIO_SMALL ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_RATIO_MEDIUM", effective: process.env.MERGE_WEEKLY_PERF_RATIO_MEDIUM ?? "(unset)", default: "(unset)" },
    { key: "MERGE_WEEKLY_PERF_RATIO_LARGE", effective: process.env.MERGE_WEEKLY_PERF_RATIO_LARGE ?? "(unset)", default: "(unset)" },
  ] as const;

  const envRows = trackedEnv.map((e) => {
    const isSet = process.env[e.key] !== undefined && process.env[e.key] !== "";
    const tag = isSet ? "(set)    " : "(default)";
    const padKey = e.key.padEnd(36, " ");
    return `    ${padKey} = ${e.effective.padEnd(10)} ${tag}`;
  });

  // Build a copy-pasteable reproduce command from ONLY the env vars that
  // were explicitly set — keeps the line short and faithful to what the
  // user actually had in their shell.
  const setEnvAssignments = trackedEnv
    .filter((e) => process.env[e.key] !== undefined && process.env[e.key] !== "")
    .map((e) => `${e.key}=${process.env[e.key]}`);
  const reproduceCmd =
    setEnvAssignments.length > 0
      ? `${setEnvAssignments.join(" ")} npm run bench:merge-weekly`
      : "npm run bench:merge-weekly  # all defaults — no env vars set";

  console.log("\n▶ mergeWeekly micro-benchmark");
  console.log(`  config: weeks=${WEEKS}  brokers=${BROKERS}  gapMod=${GAP_MOD}  runs=${RUNS}`);
  console.log(`  thresholds: budget=${BUDGET_MS}ms/call  minSpeedup=${MIN_RATIO.toFixed(2)}×`);
  console.log(`  node:   ${process.version}  platform=${process.platform}/${process.arch}`);
  console.log(`  CI=${process.env.CI ?? "(unset)"}  VERBOSE=${process.env.VERBOSE ?? "(unset)"}\n`);

  // ─── Override coherence validation ──────────────────────────────────────
  // The vitest perf suite uses MERGE_WEEKLY_PERF_* overrides scaled for its
  // 3 baked-in dataset sizes (small W=25/B=3, medium W=150/B=6, large W=800/B=12).
  // The bench uses arbitrary BENCH_WEEKS/BENCH_BROKERS. If the user pins a
  // perf override expecting one scale and runs the bench at a very different
  // scale, the override is misleading. We don't fail — just warn loudly.
  //
  // Reference points (median ms on a typical local machine):
  //   small ≈ 0.05 ms/call   medium ≈ 0.5 ms/call   large ≈ 5 ms/call
  // Cost scales roughly linearly with WEEKS × BROKERS.
  const SMALL_WB = 25 * 3;
  const LARGE_WB = 800 * 12;
  const benchScale = WEEKS * BROKERS;
  const benchVsSmall = benchScale / SMALL_WB;
  const benchVsLarge = benchScale / LARGE_WB;

  const overrideBudget = process.env.MERGE_WEEKLY_PERF_BUDGET_MS;
  const overrideRatio = process.env.MERGE_WEEKLY_PERF_RATIO;

  const warnings: string[] = [];

  if (overrideBudget !== undefined) {
    const v = Number(overrideBudget);
    if (!Number.isFinite(v) || v <= 0) {
      warnings.push(
        `MERGE_WEEKLY_PERF_BUDGET_MS="${overrideBudget}" is not a positive number — the perf test will ignore it and fall back to defaults.`
      );
    } else {
      // Tighter than ~5ms forces the LARGE bucket (~5ms baseline) to fail.
      if (v < 5 && benchVsLarge >= 0.5) {
        warnings.push(
          `MERGE_WEEKLY_PERF_BUDGET_MS=${v}ms is TOO STRICT for the large bucket — the optimized impl typically runs ~5-10 ms/call there. Expect false positives.`
        );
      }
      if (v > 1000) {
        warnings.push(
          `MERGE_WEEKLY_PERF_BUDGET_MS=${v}ms is TOO LAX — even an O(W·B·P) regression would fit under it. The perf test becomes a no-op.`
        );
      }
      // Coherence with bench's own knob.
      const benchBudgetSet = process.env.BENCH_BUDGET_MS !== undefined;
      if (benchBudgetSet && Math.abs(v - BUDGET_MS) / BUDGET_MS > 2) {
        warnings.push(
          `MERGE_WEEKLY_PERF_BUDGET_MS=${v}ms diverges by >2× from BENCH_BUDGET_MS=${BUDGET_MS}ms — the bench and the perf test will disagree on what counts as a regression.`
        );
      }
    }
  }

  if (overrideRatio !== undefined) {
    const r = Number(overrideRatio);
    if (!Number.isFinite(r) || r <= 0) {
      warnings.push(
        `MERGE_WEEKLY_PERF_RATIO="${overrideRatio}" is not a positive number — the perf test will ignore it and fall back to defaults.`
      );
    } else {
      if (r < 1.0) {
        warnings.push(
          `MERGE_WEEKLY_PERF_RATIO=${r}× is < 1.0 — this REQUIRES the optimized impl to be SLOWER than naive. Almost certainly a typo (intended ≥1.05×?).`
        );
      } else if (r < 1.05) {
        warnings.push(
          `MERGE_WEEKLY_PERF_RATIO=${r}× is below the CI floor (1.05×) — the perf test loses its ability to detect a real algorithmic regression.`
        );
      } else if (r > 5) {
        warnings.push(
          `MERGE_WEEKLY_PERF_RATIO=${r}× is unrealistically strict — even healthy runs only achieve 3-6× on the large bucket. Expect chronic flakiness.`
        );
      }
      const benchRatioSet = process.env.BENCH_MIN_RATIO !== undefined;
      if (benchRatioSet && Math.abs(r - MIN_RATIO) > 0.5) {
        warnings.push(
          `MERGE_WEEKLY_PERF_RATIO=${r}× diverges by >0.5 from BENCH_MIN_RATIO=${MIN_RATIO}× — the bench and the perf test will report different verdicts.`
        );
      }
    }
  }

  // Scale-mismatch hint: a perf override + a bench close to SMALL means
  // the bench will look fine but the LARGE bucket of the perf test won't.
  if (overrideBudget !== undefined && benchVsSmall < 5) {
    const factor = benchVsLarge < 1 ? `~${(1 / benchVsLarge).toFixed(0)}×` : "";
    warnings.push(
      `Bench scale (W×B=${benchScale}) is close to the SMALL perf bucket (W×B=${SMALL_WB}). MERGE_WEEKLY_PERF_BUDGET_MS applies to all 3 buckets — green here doesn't predict the LARGE bucket (W×B=${LARGE_WB}, ${factor} heavier).`
    );
  }

  if (warnings.length > 0) {
    console.warn("  ⚠ override coherence warnings:");
    for (const w of warnings) console.warn(`    • ${w}`);
    console.warn("");
  }

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
      "",
      // Environment snapshot — exact values used for THIS run, marked as
      // (set) if explicitly provided via env or (default) if we fell back.
      // Lets you reproduce a CI-only flake locally with one copy-paste.
      "  environment snapshot (this run):",
      ...envRows,
      ""
    );
    if (kind === "fail") {
      lines.push(
        "  failures:",
        ...failures.map((f) => `    ✗ ${f}`),
        "",
        "  reproduce (using only env vars actually set in this shell):",
        `    ${reproduceCmd}`,
        ""
      );
    } else {
      lines.push(
        "  reproduce (using only env vars actually set in this shell):",
        `    ${reproduceCmd}`,
        ""
      );
    }
    return lines;
  };

  // ─── JSON artifact (for cross-run comparison) ───────────────────────────
  // Schema is intentionally flat-ish so it's diff-friendly. `samplesMs` keeps
  // the raw per-iteration numbers so a future tool can recompute medians,
  // percentiles, or trend deltas across many runs without re-running anything.
  if (jsonPath) {
    const startedAt = new Date().toISOString();
    const resolvedPath =
      jsonPath === "default"
        ? resolve(`bench-results/merge-weekly-${startedAt.replace(/[:.]/g, "-")}.json`)
        : resolve(jsonPath);

    const artifact = {
      schemaVersion: 1,
      kind: "mergeWeekly-bench",
      startedAt,
      durationMs: opt.totalMs + nai.totalMs,
      env: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: process.env.CI ?? null,
        // Snapshot every relevant knob — set or default — so future diffs
        // can flag config drift, not just timing drift.
        knobs: Object.fromEntries(
          trackedEnv.map((e) => [
            e.key,
            {
              value: e.effective,
              isSet:
                process.env[e.key] !== undefined && process.env[e.key] !== "",
            },
          ])
        ),
      },
      config: { runs: RUNS, weeks: WEEKS, brokers: BROKERS, gapMod: GAP_MOD },
      thresholds: {
        budgetMs: BUDGET_MS,
        minRatio: MIN_RATIO,
        requiredOptimizedMaxMs: requiredOptMaxMs,
      },
      output: {
        rows,
        colsPerRow,
        optimizedJsonBytes: optimizedBytes,
        naiveJsonBytes: naiveBytes,
        shapeMatches,
      },
      timings: {
        optimized: {
          medianMs: opt.p50Ms,
          avgMs: opt.avgMs,
          p95Ms: opt.p95Ms,
          minMs: opt.minMs,
          maxMs: opt.maxMs,
          opsPerSec: opt.opsPerSec,
          samplesMs: optSamples,
        },
        naive: {
          medianMs: nai.p50Ms,
          avgMs: nai.avgMs,
          p95Ms: nai.p95Ms,
          minMs: nai.minMs,
          maxMs: nai.maxMs,
          opsPerSec: nai.opsPerSec,
          samplesMs: naiSamples,
        },
        speedup: { median: ratioMedian, mean: ratio },
      },
      verdict: {
        passed: !failed,
        failures,
        reproduceCmd,
      },
    };

    try {
      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, JSON.stringify(artifact, null, 2) + "\n", "utf8");
      console.log(`  json artifact  : ${resolvedPath}`);
    } catch (err) {
      console.error(
        `  ⚠ failed to write JSON artifact to ${resolvedPath}: ${(err as Error).message}`
      );
      // Don't mask the actual bench verdict on a write failure — keep going
      // and let the failed/healthy exit path decide the final status.
    }
  }

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
