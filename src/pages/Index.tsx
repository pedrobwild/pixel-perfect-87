import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Building2, MapPin, TrendingUp,
  MessageCircle, Wrench, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppNavbar from "@/components/AppNavbar";
import PlantasSection from "@/components/PlantasSection";
import { districtByName, formatBRL } from "@/data/districtMetrics";

const whatsappLink =
  "https://wa.me/5591984804821?text=Olá!%20Vi%20o%20site%20da%20Bwild%20e%20quero%20saber%20mais%20sobre%20os%20empreendimentos.";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Index() {
  useEffect(() => {
    document.title = "Bwild · Investimento imobiliário inteligente em short stay";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Plataforma de investimento em studios para short stay em São Paulo. Guia completo, simulador de retorno e ferramentas para investidores.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      {/* Hero */}
      <section className="scroll-mt-32 border-b border-border/50 bg-hero-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <FadeIn>
              <div className="flex flex-wrap gap-2 mb-5">
                <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/10">Leal Moreira</Badge>
                <Badge variant="outline">LM Urban Flex · Bela Cintra</Badge>
              </div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground max-w-4xl">
                Invista em
                <span className="text-gradient-premium"> short stay premium </span>
                na Bela Cintra, a 200m da Paulista.
              </h1>

              <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
                Entenda a tese de investimento, compare tipologias, simule o retorno potencial e veja por que esse
                endereço sustenta demanda forte para locação de curta temporada.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/urban-flex-bela-cintra">
                  <Button size="lg" className="min-h-[46px] bg-accent hover:bg-accent/90 text-accent-foreground">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Guia completo do investidor
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="min-h-[46px]" onClick={() => window.open(whatsappLink, "_blank")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Falar com a equipe
                </Button>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { value: "R. Bela Cintra, 209", label: "Endereço do empreendimento" },
                  { value: "18 a 83 m²", label: "Faixa de tipologias" },
                  { value: "63,53%", label: "Status geral da obra", highlight: true },
                  { value: "6 áreas", label: "Amenidades-chave" },
                ].map((kpi) => (
                  <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.highlight ? "border-primary/20 bg-primary/5" : "border-border/60 bg-background"}`}>
                    <p className={`font-display text-lg md:text-xl font-bold whitespace-nowrap ${kpi.highlight ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card className="card-elevated overflow-hidden border-primary/10">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-foreground">Por que esse ativo faz sentido</h2>
                  </div>
                  {[
                    "Endereço na Bela Cintra, a 200m da Paulista — demanda diversificada (corporativa, médica, cultural, turismo).",
                    "Tipologias de 18 a 83 m² permitem encaixar desde entrada mais leve até produto premium.",
                    "Amenidades como coworking, lavanderia e conveniência reforçam o posicionamento short stay.",
                    "Obra 63% concluída — janela de compra com preço de planta e previsibilidade de entrega.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <p className="text-sm leading-relaxed text-foreground">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>



      {/* CTA */}
      <section>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Pronto para investir com mais clareza?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Explore o guia completo, use as ferramentas de análise ou converse com a equipe comercial.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="min-h-[48px]" onClick={() => window.open(whatsappLink, "_blank")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com a equipe
              </Button>
              <Link to="/ferramentas">
                <Button size="lg" variant="outline" className="min-h-[48px] w-full sm:w-auto">
                  Ver ferramentas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/25">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 Bwild. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <Link to="/ferramentas" className="hover:text-foreground transition-colors">Ferramentas</Link>
              <Link to="/urban-flex-bela-cintra" className="hover:text-foreground transition-colors">Urban Flex</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
