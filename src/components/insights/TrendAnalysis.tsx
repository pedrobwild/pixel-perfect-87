import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, CalendarRange, AlertTriangle, Activity } from "lucide-react";

interface TrendWindow {
  windowDays: 30 | 60 | 90;
  meetings: number;
  avgScore: number;
  positiveSentimentPct: number;
  topObjections: { objection: string; count: number }[];
}

interface TrendsPayload {
  windows: TrendWindow[];
  delta30vs60: {
    meetings: number;
    avgScore: number;
    positiveSentimentPct: number;
  };
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
      </CardContent>
    </Card>
  );
}
