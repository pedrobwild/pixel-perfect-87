import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, CalendarRange, AlertTriangle, Activity, LineChart as LineChartIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendWindow {
  windowDays: 30 | 60 | 90;
  meetings: number;
  avgScore: number;
  positiveSentimentPct: number;
  topObjections: { objection: string; count: number }[];
}

interface WeeklyPoint {
  weekStart: string;
  label: string;
  meetings: number;
  avgScore: number;
}

interface TrendsPayload {
  windows: TrendWindow[];
  delta30vs60: {
    meetings: number;
    avgScore: number;
    positiveSentimentPct: number;
  };
  weekly?: WeeklyPoint[];
}

function DeltaPill({ value, suffix = "", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" />
        0{suffix}
      </span>
    );
  }
  const positive = value > 0;
  const better = invert ? !positive : positive;
  const colorClass = better ? "text-emerald-600" : "text-red-500";
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
}

function WindowCard({ win, delta, isPrimary }: { win: TrendWindow; delta?: TrendsPayload["delta30vs60"]; isPrimary?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${isPrimary ? "border-primary/30 bg-primary/[0.03]" : "border-border/60"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarRange className={`h-3.5 w-3.5 ${isPrimary ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${isPrimary ? "text-primary" : "text-muted-foreground"}`}>
            últimos {win.windowDays}d
          </span>
        </div>
        {isPrimary && delta && (
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
            vs 30d ant.
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{win.meetings}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">reuniões</p>
          {isPrimary && delta && <DeltaPill value={delta.meetings} />}
        </div>
        <div>
          <p className={`text-2xl font-bold tabular-nums ${win.avgScore >= 70 ? "text-emerald-600" : win.avgScore >= 50 ? "text-amber-600" : "text-red-500"}`}>
            {win.avgScore || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">score médio</p>
          {isPrimary && delta && <DeltaPill value={delta.avgScore} />}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{win.positiveSentimentPct}<span className="text-sm">%</span></p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">sent. positivo</p>
          {isPrimary && delta && <DeltaPill value={delta.positiveSentimentPct} suffix="%" />}
        </div>
      </div>

      {win.topObjections.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Top objeções no período
          </p>
          {win.topObjections.map((o, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground leading-snug flex-1 line-clamp-2">{o.objection}</p>
              <Badge variant="secondary" className="text-[10px] shrink-0 h-5">{o.count}x</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrendAnalysis({ trends }: { trends: TrendsPayload | undefined }) {
  if (!trends?.windows?.length) return null;
  const w30 = trends.windows.find((w) => w.windowDays === 30);
  const w60 = trends.windows.find((w) => w.windowDays === 60);
  const w90 = trends.windows.find((w) => w.windowDays === 90);

  // Hide entirely if no meetings in any window (avoid noise)
  const hasAny = trends.windows.some((w) => w.meetings > 0);
  if (!hasAny) return null;

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-primary" />
          Tendências Temporais
          <Badge variant="outline" className="ml-auto text-xs font-normal">30 / 60 / 90 dias</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {w30 && <WindowCard win={w30} delta={trends.delta30vs60} isPrimary />}
          {w60 && <WindowCard win={w60} />}
          {w90 && <WindowCard win={w90} />}
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
          Janelas cumulativas a partir de hoje. Os deltas (▲▼) comparam os últimos 30 dias com os 30 dias imediatamente anteriores.
        </p>

        {trends.weekly && trends.weekly.length > 0 && trends.weekly.some((w) => w.meetings > 0) && (
          <WeeklySparkline weekly={trends.weekly} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── 12-week evolution sparkline ────────────────────────────────

function WeeklySparkline({ weekly }: { weekly: WeeklyPoint[] }) {
  const totalMeetings = weekly.reduce((s, w) => s + w.meetings, 0);
  const activeWeeks = weekly.filter((w) => w.meetings > 0);
  const avgScore = activeWeeks.length
    ? Math.round(activeWeeks.reduce((s, w) => s + w.avgScore, 0) / activeWeeks.length)
    : 0;

  return (
    <div className="mt-5 pt-5 border-t border-border/50">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <LineChartIcon className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Evolução · 12 semanas</h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            Reuniões <span className="font-semibold text-foreground tabular-nums">{totalMeetings}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Score médio <span className="font-semibold text-foreground tabular-nums">{avgScore || "—"}</span>
          </span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weekly} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-meetings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-score" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={30}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "11px",
                padding: "6px 10px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 2 }}
              formatter={(value: number, name: string) => {
                if (name === "Reuniões") return [value, name];
                if (name === "Score médio") return [value || "—", name];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload as WeeklyPoint | undefined;
                return p ? `Semana de ${p.label}` : label;
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="meetings"
              name="Reuniões"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#grad-meetings)"
              dot={{ r: 2.5, strokeWidth: 0, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 4 }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="avgScore"
              name="Score médio"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              fill="url(#grad-score)"
              dot={{ r: 2, strokeWidth: 0, fill: "hsl(142 71% 45%)" }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
        Buckets semanais (segunda a domingo). Eixo esquerdo = volume de reuniões; eixo direito = score médio (0-100).
      </p>
    </div>
  );
}
