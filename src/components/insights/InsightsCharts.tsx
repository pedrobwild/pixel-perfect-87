import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { TrendingUp, MessageSquare, Shield, BarChart3, Clock, Calendar, Tag, Target } from "lucide-react";

interface ChartsData {
  sentimentTimeline: { date: string; title: string; sentiment: string; score: number; duration: number }[];
  sentimentDistribution: { name: string; value: number; fill: string }[];
  topCompetitors: { name: string; mentions: number }[];
  objections: { reason: string; count: number }[];
  topKeywords: { word: string; count: number }[];
  durationBuckets: { range: string; count: number }[];
  meetingsPerMonth: { month: string; count: number }[];
  formScores: { question: string; avgScore: number }[];
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(200, 80%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(15, 80%, 55%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function InsightsCharts({ data }: { data: ChartsData }) {
  if (!data) return null;

  const hasTimeline = data.sentimentTimeline?.length > 1;
  const hasCompetitors = data.topCompetitors?.length > 0;
  const hasObjections = data.objections?.length > 0;
  const hasKeywords = data.topKeywords?.length > 0;
  const hasDuration = data.durationBuckets?.some(b => b.count > 0);
  const hasMonthly = data.meetingsPerMonth?.length > 1;
  const hasFormScores = data.formScores?.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sentiment Distribution */}
      {data.sentimentDistribution?.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Distribuição de Sentimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.sentimentDistribution}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {data.sentimentDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Meetings per Month */}
      {hasMonthly && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Reuniões por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.meetingsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reuniões" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Timeline */}
      {hasTimeline && (
        <Card className="border-border/60 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              Evolução do Sentimento ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.sentimentTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  domain={[-1, 1]}
                  ticks={[-1, 0, 1]}
                  tickFormatter={(v) => v === 1 ? "+" : v === -1 ? "−" : "~"}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-xs font-medium text-foreground">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs mt-1">Sentimento: <span className="font-semibold">{d.sentiment}</span></p>
                        <p className="text-xs">Duração: <span className="font-semibold">{d.duration}min</span></p>
                      </div>
                    );
                  }}
                />
                <defs>
                  <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone" dataKey="score" name="Sentimento"
                  stroke="hsl(var(--primary))" fill="url(#sentGrad)" strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Competitors */}
      {hasCompetitors && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Concorrentes Mais Mencionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topCompetitors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mentions" name="Menções" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Objections */}
      {hasObjections && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Objeções Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.objections} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis dataKey="reason" type="category" width={120} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Frequência" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Meeting Duration */}
      {hasDuration && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Duração das Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.durationBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reuniões" fill="hsl(200, 80%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Keywords */}
      {hasKeywords && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Tag className="h-4 w-4 text-primary" />
              Palavras-chave Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.topKeywords.map((kw, i) => {
                const maxCount = data.topKeywords[0].count;
                const opacity = 0.4 + (kw.count / maxCount) * 0.6;
                const size = 0.7 + (kw.count / maxCount) * 0.4;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-foreground"
                    style={{ opacity, fontSize: `${size}rem` }}
                  >
                    {kw.word}
                    <span className="text-muted-foreground ml-1" style={{ fontSize: "0.65rem" }}>
                      {kw.count}
                    </span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Scores */}
      {hasFormScores && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Scores Médios do Formulário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.formScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 10]} />
                <YAxis dataKey="question" type="category" width={140} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgScore" name="Score Médio" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
