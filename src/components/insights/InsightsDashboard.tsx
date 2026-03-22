import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, ShieldAlert, Target, Eye, Swords, Zap,
  ArrowRight, AlertTriangle, CheckCircle2, TrendingUp,
  HelpCircle, EyeOff, Brain, Ban, MessageCircleQuestion,
} from "lucide-react";
import ScriptBuilder from "./ScriptBuilder";

interface DashboardData {
  buyerPersona: {
    summary: string;
    ageRange: string;
    professions: string[];
    motivations: string[];
    avgTicket: string;
  };
  personalityProfiles?: {
    type: string;
    description: string;
    frequency: string;
    approachStrategy: string;
    pitfalls: string;
  }[];
  topQuestions?: {
    question: string;
    frequency: string;
    idealAnswer: string;
    context: string;
  }[];
  objections: {
    objection: string;
    frequency: string;
    rebuttal: string;
  }[];
  hiddenObjections?: {
    objection: string;
    signals: string;
    approach: string;
  }[];
  closingArguments: {
    argument: string;
    effectiveness: string;
    context: string;
  }[];
  buyingSignals: {
    signal: string;
    action: string;
  }[];
  competitors: {
    name: string;
    mentions: number;
    positioning: string;
    weakness: string;
  }[];
  actionItems: {
    action: string;
    priority: string;
    impact: string;
  }[];
  sentimentSummary: string;
}

const freqColor: Record<string, string> = {
  alta: "bg-red-500/10 text-red-700 border-red-200",
  média: "bg-amber-500/10 text-amber-700 border-amber-200",
  baixa: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
};

const priorityColor: Record<string, string> = {
  alta: "bg-red-500/10 text-red-700 border-red-200",
  média: "bg-amber-500/10 text-amber-700 border-amber-200",
  baixa: "bg-muted text-muted-foreground border-border",
};

export default function InsightsDashboard({ data }: { data: DashboardData }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Buyer Persona */}
      {data.buyerPersona && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-primary" />
              Perfil do Comprador Ideal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{data.buyerPersona.summary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Faixa Etária</p>
                <p className="text-sm font-semibold text-foreground">{data.buyerPersona.ageRange}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Ticket Médio</p>
                <p className="text-sm font-semibold text-foreground">{data.buyerPersona.avgTicket}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Profissões</p>
                <div className="flex flex-wrap gap-1">
                  {data.buyerPersona.professions?.map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{p}</Badge>
                  ))}
                </div>
              </div>
            </div>
            {data.buyerPersona.motivations?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-2">Motivações</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.buyerPersona.motivations.map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs rounded-full bg-primary/8 text-primary border border-primary/15 px-2.5 py-1">
                      <TrendingUp className="h-3 w-3" />{m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personality Profiles */}
      {data.personalityProfiles?.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4.5 w-4.5 text-primary" />
              Perfis de Personalidade Identificados
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.personalityProfiles.length} perfis</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.personalityProfiles.map((p, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{p.type}</p>
                  <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${freqColor[p.frequency] || ""}`}>
                    {p.frequency}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-md bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Como atender
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{p.approachStrategy}</p>
                  </div>
                  <div className="rounded-md bg-red-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-red-700 font-medium mb-1.5 flex items-center gap-1">
                      <Ban className="h-3 w-3" /> O que evitar
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{p.pitfalls}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Script Builder */}
      {data.personalityProfiles?.length > 0 && (
        <Card className="border-border/60 overflow-hidden border-dashed border-primary/20 bg-primary/[0.02]">
          <CardContent className="pt-5 pb-5">
            <ScriptBuilder profiles={data.personalityProfiles} dashboardData={data} />
          </CardContent>
        </Card>
      )}
      {/* Top Questions */}
      {data.topQuestions?.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircleQuestion className="h-4.5 w-4.5 text-primary" />
              Perguntas Mais Frequentes dos Investidores
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.topQuestions.length} perguntas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.topQuestions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground leading-snug">"{q.question}"</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${freqColor[q.frequency] || ""}`}>
                    {q.frequency}
                  </Badge>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="rounded-md bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium mb-1">Resposta recomendada</p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{q.idealAnswer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Quando surge:</span> {q.context}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Objections + Rebuttals */}
      {data.objections?.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-primary" />
              Objeções Explícitas e Como Contornar
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.objections.length} objeções</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.objections.map((o, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground leading-snug">{o.objection}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${freqColor[o.frequency] || ""}`}>
                    {o.frequency}
                  </Badge>
                </div>
                <div className="flex items-start gap-2.5 bg-emerald-500/5 rounded-md p-3 ml-6">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{o.rebuttal}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hidden Objections */}
      {data.hiddenObjections?.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <EyeOff className="h-4.5 w-4.5 text-primary" />
              Objeções Ocultas
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.hiddenObjections.length} detectadas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.hiddenObjections.map((h, i) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">{h.objection}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-md bg-amber-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-amber-700 font-medium mb-1.5 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Como identificar
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{h.signals}</p>
                  </div>
                  <div className="rounded-md bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium mb-1.5 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Como abordar
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{h.approach}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Closing Arguments */}
        {data.closingArguments?.length > 0 && (
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-primary" />
                Argumentos que Fecham
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {data.closingArguments.map((a, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground">{a.argument}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 leading-relaxed">
                    <span className="font-medium">Quando usar:</span> {a.context}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Buying Signals */}
        {data.buyingSignals?.length > 0 && (
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-primary" />
                Sinais de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {data.buyingSignals.map((s, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                  <p className="text-sm font-medium text-foreground flex items-start gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    {s.signal}
                  </p>
                  <p className="text-xs text-muted-foreground ml-4 leading-relaxed">
                    <span className="font-medium">→ Ação:</span> {s.action}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Competitors */}
      {data.competitors?.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Swords className="h-4.5 w-4.5 text-primary" />
              Mapa Competitivo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.competitors.map((c, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    {c.mentions > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{c.mentions}x mencionado</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.positioning}</p>
                  {c.weakness && (
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium text-primary">Ponto fraco:</span>{" "}
                      <span className="text-muted-foreground">{c.weakness}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {data.actionItems?.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-primary" />
              Plano de Ação Comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {data.actionItems.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
                <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider mt-0.5 ${priorityColor[a.priority] || ""}`}>
                  {a.priority}
                </Badge>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.impact}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sentiment Summary */}
      {data.sentimentSummary && (
        <div className="rounded-lg bg-muted/40 border border-border/60 px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Sentimento Geral:</span> {data.sentimentSummary}
          </p>
        </div>
      )}
    </div>
  );
}
