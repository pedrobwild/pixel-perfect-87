import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Building2, MapPin, TrendingUp, ShieldCheck, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImg from "@/assets/hero-saopaulo.jpg";

const whatsappLink =
  "https://wa.me/5591984804821?text=Olá!%20Vi%20o%20site%20da%20Bwild%20e%20quero%20saber%20mais%20sobre%20os%20empreendimentos.";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
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
    document.title = "Bwild · Investimento imobiliário inteligente";
  }, []);

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass-nav border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            Bwild
          </a>
          <div className="flex items-center gap-3">
            <Link to="/urban-flex-bela-cintra">
              <Button variant="outline" size="sm">Urban Flex</Button>
            </Link>
            <Button size="sm" onClick={() => window.open(whatsappLink, "_blank")}>
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Contato
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Vista aérea de São Paulo" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-24 md:py-36 lg:py-44">
          <FadeIn>
            <Badge className="bg-background/15 text-background border-background/20 hover:bg-background/15 backdrop-blur-sm mb-6">
              Leal Moreira · Investimento imobiliário
            </Badge>
          </FadeIn>

          <FadeIn delay={0.08}>
            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] max-w-3xl"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              Transforme localização premium em renda recorrente.
            </h1>
          </FadeIn>

          <FadeIn delay={0.16}>
            <p className="mt-5 text-lg md:text-xl max-w-2xl leading-relaxed" style={{ color: "hsl(var(--primary-foreground) / 0.8)" }}>
              Conectamos investidores a ativos urbanos de alta demanda, com tese clara de short stay e operação simplificada.
            </p>
          </FadeIn>

          <FadeIn delay={0.24}>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link to="/urban-flex-bela-cintra">
                <Button size="lg" className="min-h-[48px]">
                  Ver Urban Flex · Bela Cintra
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[48px] border-background/30 text-background hover:bg-background/10 hover:text-background"
                onClick={() => window.open(whatsappLink, "_blank")}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com consultor
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Por que investir com a Bwild</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl">
              Tese, produto e operação em um só lugar.
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Localização estratégica",
                text: "Ativos em regiões de alta demanda corporativa, médica e turística — endereços que já vendem sozinhos.",
              },
              {
                icon: TrendingUp,
                title: "Projeção de retorno clara",
                text: "Simulador de yield, payback e composição de receita para transformar conversa comercial em decisão informada.",
              },
              {
                icon: ShieldCheck,
                title: "Operação simplificada",
                text: "Amenidades, gestão integrada e estrutura de short stay para que o investidor foque no resultado, não na operação.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <Card className="card-elevated border-border/60 h-full">
                  <CardContent className="p-6">
                    <item.icon className="h-5 w-5 text-primary mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured project */}
      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Empreendimento em destaque</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                LM Urban Flex · Bela Cintra
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
                Retrofit premium a 200 m da Av. Paulista. Studios de 18 a 83 m², amenidades de operação short stay e obra 63% concluída.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { value: "R. Bela Cintra, 209", label: "Endereço" },
                  { value: "18 a 83 m²", label: "Tipologias" },
                  { value: "63,53%", label: "Obra concluída" },
                  { value: "4 tipologias", label: "Opções de unidade" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-border/60 bg-background p-4">
                    <p className="font-display text-lg font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>

              <Link to="/urban-flex-bela-cintra" className="mt-8 inline-block">
                <Button size="lg" className="min-h-[46px]">
                  Explorar guia do investidor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card className="card-elevated border-primary/10 overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  {[
                    "Endereço ultra conhecido: Bela Cintra + Paulista.",
                    "Tipologias variadas — da entrada leve ao produto assinatura.",
                    "Amenidades pensadas para operação short stay e público corporativo.",
                    "Simulador de retorno integrado na página de venda.",
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
              Converse com a equipe comercial ou explore o guia do investidor do Urban Flex Bela Cintra.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="min-h-[48px]" onClick={() => window.open(whatsappLink, "_blank")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com a equipe
              </Button>
              <Link to="/urban-flex-bela-cintra">
                <Button size="lg" variant="outline" className="min-h-[48px]">
                  Ver guia do investidor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/25">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 Bwild. Todos os direitos reservados.</p>
          <Link to="/urban-flex-bela-cintra" className="hover:text-foreground transition-colors">
            Urban Flex · Bela Cintra
          </Link>
        </div>
      </footer>
    </div>
  );
}
