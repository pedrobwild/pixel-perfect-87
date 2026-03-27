import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, RefreshCw, Sparkles, CalendarRange, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InsightsDashboard from "./InsightsDashboard";

interface ConsolidatedData {
  totalMeetings: number;
  totalDurationMinutes: number;
  corretoresCount: number;
  latestMeeting: string | null;
  dashboard: any;
  cached: boolean;
  cacheAge?: number;
}

export default function ConsolidatedInsights() {
  const [data, setData] = useState<ConsolidatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  // Load consolidated data from all caches on mount
  useEffect(() => {
    loadFromCache();
  }, []);

  const loadFromCache = async () => {
    try {
      const { data: caches, error } = await supabase
        .from("elephant_insights_cache")
        .select("*")
        .like("cache_key", "user_%");

      if (error || !caches?.length) {
        setData(null);
        setInitialLoad(false);
        return;
      }

      const merged = mergeCacheEntries(caches);
      setData(merged);
    } catch {
      setData(null);
    } finally {
      setInitialLoad(false);
    }
  };

  const fetchFresh = async () => {
    setLoading(true);
    try {
      // First get all users
      const { data: usersRes, error: usersErr } = await supabase.functions.invoke(
        "elephant-insights",
        { body: { action: "list-users" } }
      );
      if (usersErr || !usersRes?.success) throw new Error("Erro ao listar corretores");

      const users = usersRes.users || [];
      if (!users.length) throw new Error("Nenhum corretor encontrado");

      // Fetch insights for each user (will populate cache)
      for (const user of users) {
        await supabase.functions.invoke("elephant-insights", {
          body: { userId: user.id, refresh: "true" },
        });
      }

      // Reload from cache
      await loadFromCache();
      toast({ title: "Insights consolidados atualizados", description: `${users.length} corretores processados.` });
    } catch (err: any) {
      console.error("Consolidated fetch error:", err);
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-3 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Inteligência Comercial via IA
          </Badge>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Visão Consolidada
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Insights extraídos de todas as reuniões com investidores: perfis, objeções, argumentos que convertem e sinais de compra.
          </p>
        </div>
        <div className="flex items-end gap-3 shrink-0">
          {data && (
            <Button onClick={fetchFresh} disabled={loading} variant="outline" size="lg" className="min-h-[48px]">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Forçar atualização
            </Button>
          )}
          {!data && !loading && !initialLoad && (
            <Button onClick={fetchFresh} disabled={loading} size="lg" className="min-h-[48px]">
              <Users className="mr-2 h-4 w-4" />
              Gerar insights consolidados
            </Button>
          )}
        </div>
      </div>

      {!data && !loading && !initialLoad && (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-1">Nenhum insight consolidado disponível</p>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              Clique em "Gerar insights consolidados" para processar todas as reuniões e gerar a visão geral.
            </p>
          </CardContent>
        </Card>
      )}

      {(loading || initialLoad) && !data && (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {initialLoad ? "Carregando dados…" : "Processando reuniões de todos os corretores…"}
            </p>
            {!initialLoad && (
              <p className="text-sm text-muted-foreground/60 mt-1">Pode levar até 1 minuto.</p>
            )}
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary tabular-nums">{data.totalMeetings}</p>
                <p className="text-xs text-muted-foreground mt-1">reuniões analisadas</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {data.totalDurationMinutes > 60
                    ? `${Math.round(data.totalDurationMinutes / 60)}h ${data.totalDurationMinutes % 60}m`
                    : `${data.totalDurationMinutes}m`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">tempo total gravado</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{data.corretoresCount}</p>
                <p className="text-xs text-muted-foreground mt-1">corretores</p>
              </CardContent>
            </Card>
            {data.latestMeeting && (
              <Card className="border-border/60">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                    {new Date(data.latestMeeting).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">última reunião</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Full Dashboard */}
          {data.dashboard && <InsightsDashboard data={data.dashboard} />}
        </div>
      )}
    </div>
  );
}

/** Merge multiple cache entries into a consolidated view */
function mergeCacheEntries(caches: any[]): ConsolidatedData {
  let totalMeetings = 0;
  let totalDuration = 0;
  let latestMeeting: string | null = null;
  let oldestUpdate: Date | null = null;

  // Collect all dashboard data for merging
  const allLeads: any[] = [];
  const sentimentTotals: Record<string, number[]> = {};
  const allReasonsByType: Record<string, { count: number; examples: any[] }> = {};
  const allCompetitors: Record<string, number> = {};
  const allAnswerScores: Record<string, { scores: number[]; count: number }> = {};

  // AI-generated content: merge from the most recent/complete cache
  let bestAiData: any = null;
  let bestAiMeetings = 0;

  for (const cache of caches) {
    totalMeetings += cache.total_meetings;
    totalDuration += cache.total_duration_minutes;

    if (cache.latest_meeting && (!latestMeeting || cache.latest_meeting > latestMeeting)) {
      latestMeeting = cache.latest_meeting;
    }

    const updated = new Date(cache.updated_at);
    if (!oldestUpdate || updated < oldestUpdate) oldestUpdate = updated;

    const d = cache.charts_data;
    if (!d) continue;

    // Merge leads
    if (Array.isArray(d.leadScores)) allLeads.push(...d.leadScores);

    // Merge sentiment
    if (d.metrics?.avgSentiment) {
      for (const [key, val] of Object.entries(d.metrics.avgSentiment)) {
        if (!sentimentTotals[key]) sentimentTotals[key] = [];
        sentimentTotals[key].push(val as number);
      }
    }

    // Merge reasons
    if (d.metrics?.reasonsByType) {
      for (const [type, data] of Object.entries(d.metrics.reasonsByType) as any) {
        if (!allReasonsByType[type]) allReasonsByType[type] = { count: 0, examples: [] };
        allReasonsByType[type].count += data.count || 0;
        if (data.examples) allReasonsByType[type].examples.push(...data.examples);
      }
    }

    // Merge competitors
    if (Array.isArray(d.metrics?.competitors)) {
      for (const c of d.metrics.competitors) {
        allCompetitors[c.name] = (allCompetitors[c.name] || 0) + c.mentions;
      }
    }

    // Merge answer scores
    if (Array.isArray(d.metrics?.answerScores)) {
      for (const s of d.metrics.answerScores) {
        if (!allAnswerScores[s.question]) allAnswerScores[s.question] = { scores: [], count: 0 };
        allAnswerScores[s.question].scores.push(s.avg);
        allAnswerScores[s.question].count += s.count;
      }
    }

    // Pick AI data from the cache with most meetings (most representative)
    if (cache.total_meetings > bestAiMeetings) {
      bestAiMeetings = cache.total_meetings;
      bestAiData = d;
    }
  }

  // Build merged metrics
  const avgSentiment: Record<string, number> = {};
  for (const [key, vals] of Object.entries(sentimentTotals)) {
    avgSentiment[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const competitors = Object.entries(allCompetitors)
    .map(([name, mentions]) => ({ name, mentions }))
    .sort((a, b) => b.mentions - a.mentions);

  const answerScores = Object.entries(allAnswerScores)
    .map(([question, { scores, count }]) => ({
      question,
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Trim examples
  for (const type of Object.values(allReasonsByType)) {
    type.examples = type.examples.slice(0, 5);
  }

  const mergedDashboard = {
    // AI-generated qualitative data from best source
    ...(bestAiData || {}),
    // Override metrics with merged quantitative data
    metrics: {
      avgSentiment,
      reasonsByType: allReasonsByType,
      competitors,
      answerScores,
    },
    // Merged leads
    leadScores: allLeads.sort((a, b) => b.score - a.score),
  };

  const cacheAge = oldestUpdate
    ? Math.round((Date.now() - oldestUpdate.getTime()) / 60000)
    : undefined;

  return {
    totalMeetings,
    totalDurationMinutes: totalDuration,
    corretoresCount: caches.length,
    latestMeeting,
    dashboard: mergedDashboard,
    cached: true,
    cacheAge,
  };
}
