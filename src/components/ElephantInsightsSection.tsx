import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, RefreshCw, Sparkles, CalendarRange, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InsightsDashboard from "@/components/insights/InsightsDashboard";

interface InsightsData {
  amandaName: string;
  totalMeetings: number;
  totalDurationMinutes: number;
  positiveSentimentPct: number | null;
  latestMeeting: string | null;
  cached?: boolean;
  cacheAge?: number;
  dashboard?: any;
}

export default function ElephantInsightsSection() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCache = async () => {
      try {
        const { data: cached } = await supabase
          .from("elephant_insights_cache")
          .select("*")
          .eq("cache_key", "amanda_default")
          .single();

        if (cached) {
          const age = Math.round((Date.now() - new Date(cached.updated_at).getTime()) / 60000);
          setData({
            amandaName: cached.amanda_name || "Amanda",
            totalMeetings: cached.total_meetings,
            totalDurationMinutes: cached.total_duration_minutes,
            positiveSentimentPct: cached.positive_sentiment_pct,
            latestMeeting: cached.latest_meeting,
            cached: true,
            cacheAge: age,
            dashboard: cached.charts_data,
          });
        }
      } catch {
        // No cache
      } finally {
        setInitialLoad(false);
      }
    };
    loadCache();
  }, []);

  const fetchInsights = async (refresh = false) => {
    setLoading(true);
    try {
      const fnName = refresh ? "elephant-insights?refresh=true" : "elephant-insights";
      const { data: res, error } = await supabase.functions.invoke(fnName);
      if (error) throw error;
      if (!res?.success) throw new Error(res?.error || "Erro ao buscar insights");

      setData({
        amandaName: res.amandaName,
        totalMeetings: res.totalMeetings,
        totalDurationMinutes: res.totalDurationMinutes || 0,
        positiveSentimentPct: res.positiveSentimentPct,
        latestMeeting: res.latestMeeting,
        cached: res.cached || false,
        cacheAge: res.cacheAge,
        dashboard: res.chartsData,
      });

      if (res.cached) {
        toast({ title: "Dados carregados do cache", description: `Atualizado há ${res.cacheAge} minutos.` });
      } else {
        toast({ title: "Insights atualizados", description: "Dados processados com sucesso." });
      }
    } catch (err: any) {
      console.error("ElephantInsights error:", err);
      toast({ title: "Erro ao buscar insights", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="scroll-mt-24 py-16 md:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <Badge variant="outline" className="mb-3 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Inteligência Comercial via IA
          </Badge>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Dashboard Comercial — Reuniões da Amanda
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Insights acionáveis extraídos das reuniões com investidores: objeções, argumentos que convertem e sinais de compra.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {data && (
            <Button onClick={() => fetchInsights(true)} disabled={loading} variant="outline" size="lg" className="min-h-[48px]">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Forçar atualização
            </Button>
          )}
          <Button onClick={() => fetchInsights(false)} disabled={loading} size="lg" className="min-h-[48px]">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analisando…</>
            ) : data ? (
              <><RefreshCw className="mr-2 h-4 w-4" />Atualizar</>
            ) : (
              <><Users className="mr-2 h-4 w-4" />Gerar insights</>
            )}
          </Button>
        </div>
      </div>

      {!data && !loading && !initialLoad && (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-1">Nenhum insight carregado</p>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              Clique em "Gerar insights" para analisar as reuniões e gerar o dashboard comercial.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Processando reuniões…</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Extraindo padrões e gerando dashboard. Pode levar até 30s.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-5">
          {data.cached && data.cacheAge !== undefined && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>Cache de {data.cacheAge < 60 ? `${data.cacheAge}min` : `${Math.round(data.cacheAge / 60)}h`} atrás</span>
            </div>
          )}

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
                  {data.totalDurationMinutes > 60 ? `${Math.round(data.totalDurationMinutes / 60)}h ${data.totalDurationMinutes % 60}m` : `${data.totalDurationMinutes}m`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">tempo total gravado</p>
              </CardContent>
            </Card>
            {data.positiveSentimentPct !== null && (
              <Card className="border-border/60">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600 tabular-nums">{data.positiveSentimentPct}%</p>
                  <p className="text-xs text-muted-foreground mt-1">sentimento positivo</p>
                </CardContent>
              </Card>
            )}
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

          {/* Dashboard */}
          {data.dashboard && <InsightsDashboard data={data.dashboard} />}
        </div>
      )}
    </section>
  );
}
