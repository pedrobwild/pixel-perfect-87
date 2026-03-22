import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, RefreshCw, Sparkles, CalendarRange } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InsightsData {
  insights: string;
  amandaName: string;
  totalMeetings: number;
  latestMeeting: string | null;
}

export default function ElephantInsightsSection() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("elephant-insights");

      if (error) throw error;

      if (result?.success) {
        setData({
          insights: result.insights,
          amandaName: result.amandaName,
          totalMeetings: result.totalMeetings,
          latestMeeting: result.latestMeeting,
        });
      } else {
        throw new Error(result?.error || "Erro ao buscar insights");
      }
    } catch (err: any) {
      console.error("ElephantInsights error:", err);
      toast({
        title: "Erro ao buscar insights",
        description: err.message || "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;

      if (trimmed.startsWith("### "))
        return <h4 key={i} className="text-base font-semibold text-foreground mt-5 mb-2">{trimmed.slice(4)}</h4>;
      if (trimmed.startsWith("## "))
        return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{trimmed.slice(3)}</h3>;
      if (trimmed.startsWith("# "))
        return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{trimmed.slice(2)}</h3>;

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemText = trimmed.slice(2);
        return (
          <div key={i} className="flex items-start gap-2 py-1">
            <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(itemText) }} />
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
        <Button
          onClick={fetchInsights}
          disabled={loading}
          size="lg"
          className="min-h-[48px] shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando reuniões…
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

      {!data && !loading && (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium mb-1">Nenhum insight carregado</p>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              Clique em "Gerar insights comerciais" para analisar as reuniões da Amanda e consolidar padrões de comportamento dos investidores.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Analisando reuniões do AskElephant…</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Buscando dados e consolidando com IA. Pode levar até 30 segundos.</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{data.totalMeetings}</p>
                <p className="text-xs text-muted-foreground mt-1">reuniões analisadas</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{data.amandaName}</p>
                <p className="text-xs text-muted-foreground mt-1">consultora</p>
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
