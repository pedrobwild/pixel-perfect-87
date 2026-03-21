import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Building2, MapPin, TrendingUp, ShieldCheck,
  MessageCircle, BookOpen, Wrench, BarChart3, CheckCircle2,
  Users, Star, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppNavbar from "@/components/AppNavbar";
import heroImg from "@/assets/hero-saopaulo.jpg";

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Vista aérea de São Paulo" className="h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-foreground/65" />
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
              <Link to="/guia-short-stay">
                <Button size="lg" className="min-h-[48px] w-full sm:w-auto">
                  Explorar o Guia do Investidor
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

          {/* Quick stats */}
          <FadeIn delay={0.32}>
            <div className="mt-14 flex flex-wrap gap-8 md:gap-12">
              {[
                { value: "12+", label: "Bairros analisados" },
                { value: "R$ 350", label: "Diária média (studios)" },
                { value: "78%", label: "Ocupação média SP" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl md:text-3xl font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>{s.value}</p>
                  <p className="text-sm mt-0.5" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* What we offer — 3 pillars */}
      <section className="border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">O que oferecemos</p>
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
                text: "Amenidades, gestão integrada e estrutura de short stay para que o investidor foque no resultado.",
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

      {/* Tools & Guide — cross-link section */}
      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Recursos para o investidor</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl">
              Tome decisões baseadas em dados, não em achismo.
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Guia */}
            <FadeIn delay={0.05}>
              <Card className="card-elevated border-border/60 h-full group hover:border-primary/30 transition-colors">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Guia Short Stay</h3>
                      <p className="text-xs text-muted-foreground">4 fases · 12+ seções</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Mapa de bairros rentáveis com dados de ocupação",
                      "Simulador de receita e ROI por tipologia",
                      "Checklist completo de due diligence",
                      "Análise de mercado e tendências 2025–2026",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/guia-short-stay">
                    <Button className="w-full min-h-[44px] group-hover:bg-primary/90 transition-colors">
                      Ler o guia completo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Ferramentas */}
            <FadeIn delay={0.12}>
              <Card className="card-elevated border-border/60 h-full group hover:border-primary/30 transition-colors">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Ferramentas do Investidor</h3>
                      <p className="text-xs text-muted-foreground">Diagnóstico · Simulador · Ranking</p>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Diagnóstico de perfil do investidor personalizado",
                      "Simulador de receita com cenários otimista/conservador",
                      "Ranking de bairros por score de investimento",
                      "Comparativo de tipologias e retorno esperado",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/ferramentas">
                    <Button variant="outline" className="w-full min-h-[44px]">
                      Acessar ferramentas
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Featured project — Urban Flex */}
      <section className="border-b border-border/40">
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

      {/* Social proof */}
      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <FadeIn>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Users, value: "120+", label: "Investidores atendidos" },
                { icon: Building2, value: "3", label: "Empreendimentos ativos" },
                { icon: Star, value: "4.8", label: "Nota média dos studios" },
                { icon: Compass, value: "São Paulo", label: "Mercado principal" },
              ].map((stat, i) => (
                <FadeIn key={stat.label} delay={i * 0.06}>
                  <div className="text-center p-4">
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-3" />
                    <p className="font-display text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
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
              <Link to="/guia-short-stay">
                <Button size="lg" variant="outline" className="min-h-[48px] w-full sm:w-auto">
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 Bwild. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <Link to="/guia-short-stay" className="hover:text-foreground transition-colors">Guia Short Stay</Link>
              <Link to="/ferramentas" className="hover:text-foreground transition-colors">Ferramentas</Link>
              <Link to="/urban-flex-bela-cintra" className="hover:text-foreground transition-colors">Urban Flex</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
