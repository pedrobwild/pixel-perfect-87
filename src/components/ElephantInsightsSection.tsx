import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, RefreshCw, Sparkles, CalendarRange, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InsightsCharts from "@/components/insights/InsightsCharts";

interface InsightsData {
  insights: string;
  amandaName: string;
  totalMeetings: number;
  totalDurationMinutes: number;
  positiveSentimentPct: number | null;
  latestMeeting: string | null;
  cached?: boolean;
  cacheAge?: number;
  chartsData?: any;
}

export default function ElephantInsightsSection() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { toast } = useToast();

  // Load cached data on mount
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
            insights: cached.insights,
            amandaName: cached.amanda_name || "Amanda",
            totalMeetings: cached.total_meetings,
            totalDurationMinutes: cached.total_duration_minutes,
            chartsData: cached.charts_data,
            positiveSentimentPct: cached.positive_sentiment_pct,
            latestMeeting: cached.latest_meeting,
            cached: true,
            cacheAge: age,
          });
        }
      } catch {
        // No cache, that's fine
      } finally {
        setInitialLoad(false);
      }
    };
    loadCache();
  }, []);

  const fetchInsights = async (refresh = false) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("elephant-insights", {
        body: null,
        headers: {},
      });

      // If we want refresh, call with query param
      const finalResult = refresh
        ? await supabase.functions.invoke("elephant-insights?refresh=true")
        : { data: result, error };

      const res = refresh ? finalResult.data : result;
      const err = refresh ? finalResult.error : error;

      if (err) throw err;

      if (res?.success) {
        setData({
          insights: res.insights,
          amandaName: res.amandaName,
          totalMeetings: res.totalMeetings,
          totalDurationMinutes: res.totalDurationMinutes || 0,
          positiveSentimentPct: res.positiveSentimentPct,
          latestMeeting: res.latestMeeting,
          cached: res.cached || false,
          cacheAge: res.cacheAge,
          chartsData: res.chartsData,
        });
        if (res.cached) {
          toast({ title: "Insights carregados do cache", description: `Dados de ${res.cacheAge} minutos atrás.` });
        }
      } else {
        throw new Error(res?.error || "Erro ao buscar insights");
      }
    } catch (err: any) {
      console.error("ElephantInsights error:", err);
      toast({ title: "Erro ao buscar insights", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith("### ")) return <h4 key={i} className="text-base font-semibold text-foreground mt-5 mb-2">{trimmed.slice(4)}</h4>;
      if (trimmed.startsWith("## ")) return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{trimmed.slice(3)}</h3>;
      if (trimmed.startsWith("# ")) return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{trimmed.slice(2)}</h3>;
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={i} className="flex items-start gap-2 py-1">
            <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(trimmed.slice(2)) }} />
          </div>
        );
      }
      const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        return (
          <div key={i} className="flex items-start gap-2.5 py-1">
            <span className="text-xs font-bold text-primary mt-0.5 shrink-0 w-5 text-right">{numMatch[1]}.</span>
            <span className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(numMatch[2]) }} />
          </div>
        );
      }
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed py-0.5" dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />;
    });
  };

  const boldify = (text: string) =>
    text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');

  return (
    <section id="elephant-insights" className="scroll-mt-24 py-16 md:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <Badge variant="outline" className="mb-3 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Insights de Reuniões via IA
          </Badge>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Inteligência Comercial — Reuniões da Amanda
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Consolidação dos principais padrões e insights extraídos das reuniões com investidores interessados em studios para short stay.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {data && (
            <Button
              onClick={() => fetchInsights(true)}
              disabled={loading}
              variant="outline"
              size="lg"
              className="min-h-[48px]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Forçar atualização
            </Button>
          )}
          <Button
            onClick={() => fetchInsights(false)}
            disabled={loading}
            size="lg"
            className="min-h-[48px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando…
              </>
            ) : data ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar insights
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Gerar insights comerciais
              </>
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
              Clique em "Gerar insights comerciais" para analisar as reuniões da Amanda.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Analisando reuniões do Elephan…</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Pode levar até 30 segundos.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          {data.cached && data.cacheAge !== undefined && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>Cache de {data.cacheAge < 60 ? `${data.cacheAge}min` : `${Math.round(data.cacheAge / 60)}h`} atrás</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{data.totalMeetings}</p>
                <p className="text-xs text-muted-foreground mt-1">reuniões analisadas</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{data.totalDurationMinutes > 60 ? `${Math.round(data.totalDurationMinutes / 60)}h ${data.totalDurationMinutes % 60}m` : `${data.totalDurationMinutes}m`}</p>
                <p className="text-xs text-muted-foreground mt-1">tempo total gravado</p>
              </CardContent>
            </Card>
            {data.positiveSentimentPct !== null && (
              <Card className="border-border/60">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{data.positiveSentimentPct}%</p>
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

          {data.chartsData && <InsightsCharts data={data.chartsData} />}

          <Card className="border-border/60 card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Insights Consolidados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose-sm max-w-none">{renderMarkdown(data.insights)}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
