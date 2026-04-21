import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { LineChart as LineChartIcon, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeeklyPoint {
  weekStart: string;
  label: string;
  meetings: number;
  avgScore: number;
}

export interface BrokerSeries {
  name: string;
  weekly: WeeklyPoint[] | undefined;
}

type Metric = "meetings" | "avgScore";

// Stable, theme-aware palette (HSL via design tokens for first two; explicit fallbacks beyond).
// We map by index, not name — the parent passes a stable order (A then B).
const SERIES_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "hsl(24 90% 55%)", // orange — fallback for 3rd broker
  "hsl(155 65% 40%)", // green — fallback for 4th broker
];

interface MergedRow {
  label: string;
  weekStart: string;
  // dynamic per-broker keys: e.g. broker_0, broker_1
  [key: string]: number | string | null;
}

/**
 * Merges weekly arrays from multiple brokers into a single chart dataset.
 * Aligns on weekStart (ISO week-anchored Monday). Missing weeks for a broker = null
 * so the line connects across gaps via `connectNulls`.
 */
function mergeWeekly(series: BrokerSeries[]): MergedRow[] {
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
      // Avoid plotting score=0 when no meetings happened (would drag line to 0)
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

function CompareTooltip({ active, payload, label, series, metric }: any) {
  if (!active || !payload?.length) return null;
  const unit = metric === "meetings" ? "reuniões" : "/ 100";
  return (
    <div className="rounded-md border border-border/60 bg-popover px-3 py-2 text-xs shadow-md min-w-[200px]">
      <p className="font-semibold text-foreground mb-1.5 pb-1.5 border-b border-border/40">
        Semana de {label}
      </p>
      <div className="space-y-1">
        {series.map((s: BrokerSeries, idx: number) => {
          const value = payload.find((p: any) => p.dataKey === `${metric}_${idx}`)?.value;
          const display = value == null ? "—" : metric === "avgScore" ? `${value} ${unit}` : `${value} ${unit}`;
          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground truncate">
                <span
                  className="inline-block h-2 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: SERIES_COLORS[idx] }}
                  aria-hidden
                />
                <span className="truncate">{s.name}</span>
              </span>
              <span className="font-bold text-foreground tabular-nums shrink-0">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MultiBrokerWeeklySparkline({ series }: { series: BrokerSeries[] }) {
  const [metric, setMetric] = useState<Metric>("meetings");
  const data = useMemo(() => mergeWeekly(series), [series]);
  const hasAny = data.some((row) =>
    series.some((_, idx) => {
      const v = row[`${metric}_${idx}`];
      return typeof v === "number" && v > 0;
    })
  );

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-background/60 p-2 border border-border/40">
            <GitCompareArrows className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Evolução semanal comparada
            </p>
            <p className="text-sm text-muted-foreground/90">
              Dados semanais ainda não disponíveis para os corretores selecionados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-2 bg-card">
      <div className="flex items-center gap-1.5 flex-wrap">
        <LineChartIcon className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Evolução semanal comparada · últimas 12 semanas
        </span>
        <div
          className="ml-auto inline-flex rounded-md border border-border/60 p-0.5 bg-muted/30"
          role="group"
          aria-label="Métrica do gráfico"
        >
          <button
            type="button"
            onClick={() => setMetric("meetings")}
            aria-pressed={metric === "meetings"}
            className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-sm transition-colors ${
              metric === "meetings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Reuniões
          </button>
          <button
            type="button"
            onClick={() => setMetric("avgScore")}
            aria-pressed={metric === "avgScore"}
            className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-sm transition-colors ${
              metric === "avgScore"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Score
          </button>
        </div>
        <div className="basis-full flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          {series.map((s, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-3"
                style={{ backgroundColor: SERIES_COLORS[idx] }}
                aria-hidden
              />
              <span className="truncate max-w-[160px]">{s.name}</span>
            </span>
          ))}
          {!hasAny && (
            <Badge variant="outline" className="text-[10px] font-normal ml-auto">
              Sem dados na métrica selecionada
            </Badge>
          )}
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={32}
              domain={metric === "avgScore" ? [0, 100] : ["auto", "auto"]}
            />
            <Tooltip
              content={<CompareTooltip series={series} metric={metric} />}
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="bottom"
              height={0}
              wrapperStyle={{ display: "none" }}
            />
            {series.map((_, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`${metric}_${idx}`}
                stroke={SERIES_COLORS[idx]}
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 0, fill: SERIES_COLORS[idx] }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        Linhas alinhadas por semana (segunda-feira UTC). Semanas sem reuniões para um corretor
        ficam ocultas (linha conecta os pontos vizinhos).
      </p>
    </div>
  );
}
