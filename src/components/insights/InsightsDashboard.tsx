import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, ShieldAlert, Target, Eye, Swords, Zap,
  ArrowRight, AlertTriangle, CheckCircle2, TrendingUp,
  HelpCircle, EyeOff, Brain, Ban, MessageCircleQuestion,
} from "lucide-react";
import ScriptBuilder from "./ScriptBuilder";
import LeadRanking from "./LeadRanking";

/** Safely convert any value to a renderable string — prevents React error #31 */
function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

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
  sentimentSummary: string | Record<string, unknown>;
  leadScores?: {
    title: string;
    date: string | null;
    durationMinutes: number;
    sentiment: string | null;
    score: number;
    objectionCount: number;
    competitorMentions: number;
    summary: string | null;
  }[];
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

export default function InsightsDashboard({ data }: { data: any }) {
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
            <p className="text-sm text-muted-foreground leading-relaxed">{safeText(data.buyerPersona.summary)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Faixa Etária</p>
                <p className="text-sm font-semibold text-foreground">{safeText(data.buyerPersona.ageRange)}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Ticket Médio</p>
                <p className="text-sm font-semibold text-foreground">{safeText(data.buyerPersona.avgTicket)}</p>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Profissões</p>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(data.buyerPersona.professions) ? data.buyerPersona.professions : []).map((p: unknown, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">{safeText(p)}</Badge>
                  ))}
                </div>
              </div>
            </div>
            {Array.isArray(data.buyerPersona.motivations) && data.buyerPersona.motivations.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-2">Motivações</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.buyerPersona.motivations.map((m: unknown, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs rounded-full bg-primary/8 text-primary border border-primary/15 px-2.5 py-1">
                      <TrendingUp className="h-3 w-3" />{safeText(m)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personality Profiles */}
      {Array.isArray(data.personalityProfiles) && data.personalityProfiles.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4.5 w-4.5 text-primary" />
              Perfis de Personalidade Identificados
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.personalityProfiles.length} perfis</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.personalityProfiles.map((p: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{safeText(p.type)}</p>
                  <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${freqColor[safeText(p.frequency)] || ""}`}>
                    {safeText(p.frequency)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{safeText(p.description)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-md bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Como atender
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{safeText(p.approachStrategy)}</p>
                  </div>
                  <div className="rounded-md bg-red-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-red-700 font-medium mb-1.5 flex items-center gap-1">
                      <Ban className="h-3 w-3" /> O que evitar
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{safeText(p.pitfalls)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Script Builder */}
      {Array.isArray(data.personalityProfiles) && data.personalityProfiles.length > 0 && (
        <Card className="border-border/60 overflow-hidden border-dashed border-primary/20 bg-primary/[0.02]">
          <CardContent className="pt-5 pb-5">
            <ScriptBuilder profiles={data.personalityProfiles} dashboardData={data} />
          </CardContent>
        </Card>
      )}

      {/* Top Questions */}
      {Array.isArray(data.topQuestions) && data.topQuestions.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircleQuestion className="h-4.5 w-4.5 text-primary" />
              Perguntas Mais Frequentes dos Investidores
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.topQuestions.length} perguntas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.topQuestions.map((q: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground leading-snug">"{safeText(q.question)}"</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${freqColor[safeText(q.frequency)] || ""}`}>
                    {safeText(q.frequency)}
                  </Badge>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="rounded-md bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium mb-1">Resposta recomendada</p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{safeText(q.idealAnswer)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Quando surge:</span> {safeText(q.context)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Objections + Rebuttals */}
      {Array.isArray(data.objections) && data.objections.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-primary" />
              Objeções Explícitas e Como Contornar
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.objections.length} objeções</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.objections.map((o: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground leading-snug">{safeText(o.objection)}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider ${freqColor[safeText(o.frequency)] || ""}`}>
                    {safeText(o.frequency)}
                  </Badge>
                </div>
                <div className="flex items-start gap-2.5 bg-emerald-500/5 rounded-md p-3 ml-6">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{safeText(o.rebuttal)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hidden Objections */}
      {Array.isArray(data.hiddenObjections) && data.hiddenObjections.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <EyeOff className="h-4.5 w-4.5 text-primary" />
              Objeções Ocultas
              <Badge variant="outline" className="ml-auto text-xs font-normal">{data.hiddenObjections.length} detectadas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.hiddenObjections.map((h: any, i: number) => (
              <div key={i} className="rounded-lg border border-border/60 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">{safeText(h.objection)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="rounded-md bg-amber-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-amber-700 font-medium mb-1.5 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Como identificar
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{safeText(h.signals)}</p>
                  </div>
                  <div className="rounded-md bg-emerald-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium mb-1.5 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Como abordar
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{safeText(h.approach)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Closing Arguments */}
        {Array.isArray(data.closingArguments) && data.closingArguments.length > 0 && (
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-primary" />
                Argumentos que Fecham
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {data.closingArguments.map((a: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-foreground">{safeText(a.argument)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6 leading-relaxed">
                    <span className="font-medium">Quando usar:</span> {safeText(a.context)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Buying Signals */}
        {Array.isArray(data.buyingSignals) && data.buyingSignals.length > 0 && (
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-primary" />
                Sinais de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {data.buyingSignals.map((s: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                  <p className="text-sm font-medium text-foreground flex items-start gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    {safeText(s.signal)}
                  </p>
                  <p className="text-xs text-muted-foreground ml-4 leading-relaxed">
                    <span className="font-medium">→ Ação:</span> {safeText(s.action)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Competitors */}
      {Array.isArray(data.competitors) && data.competitors.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Swords className="h-4.5 w-4.5 text-primary" />
              Mapa Competitivo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.competitors.map((c: any, i: number) => (
                <div key={i} className="rounded-lg border border-border/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{safeText(c.name)}</p>
                    {c.mentions > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{c.mentions}x mencionado</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{safeText(c.positioning)}</p>
                  {c.weakness && (
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium text-primary">Ponto fraco:</span>{" "}
                      <span className="text-muted-foreground">{safeText(c.weakness)}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {Array.isArray(data.actionItems) && data.actionItems.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-primary" />
              Plano de Ação Comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            {data.actionItems.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
                <Badge variant="outline" className={`shrink-0 text-[10px] uppercase tracking-wider mt-0.5 ${priorityColor[safeText(a.priority)] || ""}`}>
                  {safeText(a.priority)}
                </Badge>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-foreground">{safeText(a.action)}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{safeText(a.impact)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lead Ranking */}
      {data.leadScores && <LeadRanking leads={data.leadScores} />}

      {/* Sentiment Summary */}
      {data.sentimentSummary && (
        <div className="rounded-lg bg-muted/40 border border-border/60 px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Sentimento Geral:</span>{" "}
            {safeText(data.sentimentSummary)}
          </p>
        </div>
      )}
    </div>
  );
}
