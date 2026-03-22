import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import {
  Calculator, TrendingUp, CalendarDays, DollarSign, ArrowUpRight,
  Landmark, TrendingDown,
} from "lucide-react";
import { TYPOLOGIES, PROPERTY, type Typology } from "@/data/propertyData";

interface EventItem {
  name: string;
  category: string;
  dateRange: string;
  dailyRateImpact: string;
  estimatedDailyRate: string;
  durationDays: number;
  occupancyImpact: string;
}

interface EventsData {
  events: EventItem[];
  baselineDaily: string;
  estimatedAnnualBoost: string;
}

interface Props {
  eventsData: EventsData | null;
}

// Parse "+XX%" to number
function parsePercent(s: string): number {
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

// Map month names to index
const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MONTH_MAP: Record<string, number[]> = {
  janeiro: [0], fevereiro: [1], março: [2], abril: [3],
  maio: [4], junho: [5], julho: [6], agosto: [7],
  setembro: [8], outubro: [9], novembro: [10], dezembro: [11],
  jan: [0], fev: [1], mar: [2], abr: [3], mai: [4], jun: [5],
  jul: [6], ago: [7], set: [8], out: [9], nov: [10], dez: [11],
};

function guessMonths(dateRange: string): number[] {
  const lower = dateRange.toLowerCase();
  const months: number[] = [];
  for (const [key, indices] of Object.entries(MONTH_MAP)) {
    if (lower.includes(key)) months.push(...indices);
  }
  // If nothing matched, try to find a month number pattern
  if (months.length === 0) {
    const numMatch = lower.match(/(\d{1,2})\/(\d{4})/);
    if (numMatch) {
      const m = parseInt(numMatch[1]) - 1;
      if (m >= 0 && m <= 11) months.push(m);
    }
  }
  return [...new Set(months)];
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function RevenueSimulator({ eventsData }: Props) {
  const [selectedTypo, setSelectedTypo] = useState<string>(TYPOLOGIES[0].id);
  const [occupancy, setOccupancy] = useState<number>(PROPERTY.avgOccupancy);

  const typo = TYPOLOGIES.find((t) => t.id === selectedTypo) || TYPOLOGIES[0];

  const simulation = useMemo(() => {
    // Build monthly event boost map
    const monthBoosts: { boost: number; events: string[] }[] = Array.from({ length: 12 }, () => ({
      boost: 0,
      events: [],
    }));

    if (eventsData?.events) {
      for (const event of eventsData.events) {
        const impactPct = parsePercent(event.dailyRateImpact);
        const months = guessMonths(event.dateRange);
        // Weight the boost by event duration relative to month (approx 30 days)
        const daysWeight = Math.min(event.durationDays || 3, 30) / 30;
        for (const m of months) {
          monthBoosts[m].boost += impactPct * daysWeight;
          monthBoosts[m].events.push(event.name);
        }
      }
    }

    const nightsBase = 30 * (occupancy / 100);
    const dailyBase = typo.dailyEstimate;

    const months = MONTH_NAMES.map((name, i) => {
      const boost = monthBoosts[i].boost;
      const revenueBase = Math.round(dailyBase * nightsBase);
      const boostedDaily = Math.round(dailyBase * (1 + boost / 100));
      // Events also boost occupancy slightly
      const occupancyBoost = Math.min(boost * 0.15, 20); // cap at +20pp
      const nightsBoosted = Math.min(30, 30 * ((occupancy + occupancyBoost) / 100));
      const revenueWithEvents = Math.round(boostedDaily * nightsBoosted);
      const extraRevenue = revenueWithEvents - revenueBase;

      return {
        name,
        revenueBase,
        extraRevenue,
        revenueTotal: revenueWithEvents,
        boost: Math.round(boost),
        events: monthBoosts[i].events,
        dailyBase,
        boostedDaily,
        nightsBase: Math.round(nightsBase),
        nightsBoosted: Math.round(nightsBoosted),
      };
    });

    const annualBase = months.reduce((s, m) => s + m.revenueBase, 0);
    const annualTotal = months.reduce((s, m) => s + m.revenueTotal, 0);
    const annualExtra = annualTotal - annualBase;
    const annualExtraPct = annualBase > 0 ? Math.round((annualExtra / annualBase) * 100) : 0;

    const grossYieldBase = (annualBase / typo.purchasePrice) * 100;
    const grossYieldTotal = (annualTotal / typo.purchasePrice) * 100;
    const netYieldTotal = grossYieldTotal * 0.75;

    const bestMonth = months.reduce((best, m) => m.revenueTotal > best.revenueTotal ? m : best, months[0]);

    return {
      months,
      annualBase,
      annualTotal,
      annualExtra,
      annualExtraPct,
      grossYieldBase: Number(grossYieldBase.toFixed(1)),
      grossYieldTotal: Number(grossYieldTotal.toFixed(1)),
      netYieldTotal: Number(netYieldTotal.toFixed(1)),
      bestMonth,
    };
  }, [eventsData, selectedTypo, occupancy, typo]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="rounded-lg border border-border bg-background p-3 shadow-lg text-xs space-y-1.5 max-w-[220px]">
        <p className="font-semibold text-foreground">{label}</p>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sem eventos:</span>
          <span className="font-medium text-foreground tabular-nums">{formatCurrency(data.revenueBase)}</span>
        </div>
        {data.extraRevenue > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Extra eventos:</span>
            <span className="font-medium text-emerald-600 tabular-nums">+{formatCurrency(data.extraRevenue)}</span>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-border/60 pt-1.5">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-bold text-foreground tabular-nums">{formatCurrency(data.revenueTotal)}</span>
        </div>
        {data.boost > 0 && (
          <p className="text-[10px] text-muted-foreground/70">
            Diária: {formatCurrency(data.dailyBase)} → {formatCurrency(data.boostedDaily)} (+{data.boost}%)
          </p>
        )}
        {data.events?.length > 0 && (
          <div className="border-t border-border/60 pt-1.5">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Eventos:</p>
            {data.events.map((e: string, i: number) => (
              <p key={i} className="text-[10px] text-muted-foreground/70">• {e}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <div>
        <Badge variant="outline" className="mb-3 text-primary border-primary/30">
          <Calculator className="h-3 w-3 mr-1" />
          Simulador de Receita
        </Badge>
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
          Receita Mensal: Eventos × Ocupação
        </h2>
        <p className="text-muted-foreground text-sm mt-1 max-w-xl">
          Simule o faturamento mensal do proprietário considerando o impacto dos grandes eventos de SP na diária e ocupação.
        </p>
      </div>

      {/* Controls */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipologia</label>
              <Select value={selectedTypo} onValueChange={setSelectedTypo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPOLOGIES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label} — {formatCurrency(t.purchasePrice)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Diária base: {formatCurrency(typo.dailyEstimate)}/noite
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ocupação base: {occupancy}%
              </label>
              <Slider
                value={[occupancy]}
                onValueChange={([v]) => setOccupancy(v)}
                min={50}
                max={95}
                step={1}
                className="mt-3"
              />
              <p className="text-[11px] text-muted-foreground">
                Média da região: {PROPERTY.avgOccupancy}% · {Math.round(30 * occupancy / 100)} noites/mês
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(simulation.annualBase)}</p>
            <p className="text-xs text-muted-foreground mt-1">receita anual sem eventos</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-emerald-500/[0.03]">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(simulation.annualTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">receita anual com eventos</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-primary tabular-nums flex items-center justify-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              +{formatCurrency(simulation.annualExtra)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">receita extra (+{simulation.annualExtraPct}%)</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-foreground tabular-nums">
              {simulation.grossYieldTotal}%
              <span className="text-xs font-normal text-muted-foreground ml-1">bruto</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {simulation.netYieldTotal}% líq. · sem eventos: {simulation.grossYieldBase}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
            Faturamento Mensal Projetado
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {typo.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulation.months} barCategoryGap="12%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value: string) =>
                    value === "revenueBase" ? "Sem eventos" : "Extra eventos"
                  }
                />
                <ReferenceLine
                  y={simulation.annualTotal / 12}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: `Média: ${formatCurrency(Math.round(simulation.annualTotal / 12))}`,
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "hsl(var(--primary))",
                  }}
                />
                <Bar dataKey="revenueBase" stackId="a" fill="hsl(var(--muted-foreground) / 0.25)" radius={[0, 0, 0, 0]} name="revenueBase" />
                <Bar dataKey="extraRevenue" stackId="a" radius={[4, 4, 0, 0]} name="extraRevenue">
                  {simulation.months.map((m, i) => (
                    <Cell
                      key={i}
                      fill={m.extraRevenue > 0 ? "hsl(142, 71%, 45%)" : "transparent"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Best month callout */}
          {simulation.bestMonth.events.length > 0 && (
            <div className="mt-3 rounded-lg bg-emerald-500/5 border border-emerald-200/40 p-3 flex items-start gap-2.5">
              <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  Melhor mês: {simulation.bestMonth.name} — {formatCurrency(simulation.bestMonth.revenueTotal)}
                </p>
                <p className="text-[11px] text-emerald-600/70 mt-0.5">
                  Eventos: {simulation.bestMonth.events.join(", ")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!eventsData && (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-8 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Carregue os eventos acima para ver o impacto na receita</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Sem dados de eventos, o simulador mostra apenas a receita base com ocupação de {occupancy}%.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
