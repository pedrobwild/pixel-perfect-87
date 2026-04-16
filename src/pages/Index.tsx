import { useEffect, useRef, useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Building2, MapPin, TrendingUp,
  MessageCircle, Wrench, BarChart3, Eye,
  CheckCircle2, Clock, Sparkles, Shield,
  Target, Calculator, Map, ListChecks, Lightbulb, ClipboardCheck,
  ChevronDown
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppNavbar from "@/components/AppNavbar";
import MobileQuickNav from "@/components/MobileQuickNav";
import heroImg from "@/assets/uf-fachada.jpeg";
import { DISTRICTS_MOCK, districtByName, formatBRL } from "@/data/districtMetrics";

const ComparativoRegional = lazy(() => import("@/components/ComparativoRegional"));
const PlantasSection = lazy(() => import("@/components/PlantasSection"));

const guideItems = [
  { title: "Quiz de Perfil", desc: "Descubra qual tipologia combina com seu objetivo de investimento.", icon: Target, hash: "diagnostico" },
  { title: "Simulador de Retorno", desc: "Projete receita em cenários otimista e conservador.", icon: Calculator, hash: "simulador" },
  { title: "Análise de Bairro", desc: "Dados de ocupação, diária e yield da Consolação vs. concorrentes.", icon: Map, hash: "localizacao" },
  { title: "Checklist de Escolha", desc: "16 critérios técnicos para avaliar o imóvel com clareza.", icon: ListChecks, hash: "escolha-ativo" },
  { title: "Checklist de Prontidão", desc: "10 itens para garantir que você está pronto para fechar.", icon: ClipboardCheck, hash: "checklist-final" },
  { title: "Estratégia de Renda", desc: "Como operar short stay e maximizar retorno desde o dia 1.", icon: Lightbulb, hash: "rentabilidade" },
];

const guidePriorityItems = guideItems.slice(0, 3);
const guideSecondaryItems = guideItems.slice(3);

const whatsappLink =
  "https://wa.me/5591984804821?text=Olá!%20Vi%20o%20site%20da%20Bwild%20e%20quero%20saber%20mais%20sobre%20o%20Urban%20Flex%20Bela%20Cintra.";

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
  const cons = useMemo(() => districtByName.get("Consolação"), []);
  const isMobile = useIsMobile();
  const [activeGuideCard, setActiveGuideCard] = useState(0);

  const heroRef = useRef<HTMLElement>(null);
  const tipologiasRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Sticky CTA visibility: show after hero exits viewport, hide when #tipologias is visible
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    if (!isMobile) { setShowStickyCta(false); return; }

    const heroEl = heroRef.current;
    const tipEl = document.getElementById("tipologias");
    if (!heroEl) return;

    let heroOut = false;
    let tipIn = false;

    const heroObs = new IntersectionObserver(([e]) => {
      heroOut = !e.isIntersecting;
      setShowStickyCta(heroOut && !tipIn);
    }, { threshold: 0 });

    const tipObs = new IntersectionObserver(([e]) => {
      tipIn = e.isIntersecting;
      setShowStickyCta(heroOut && !tipIn);
    }, { threshold: 0 });

    heroObs.observe(heroEl);
    // tipologias section may mount later — retry
    const tryObserveTip = () => {
      const el = document.getElementById("tipologias");
      if (el) { tipObs.observe(el); return true; }
      return false;
    };
    if (!tryObserveTip()) {
      const t = setTimeout(tryObserveTip, 500);
      return () => { clearTimeout(t); heroObs.disconnect(); tipObs.disconnect(); };
    }

    return () => { heroObs.disconnect(); tipObs.disconnect(); };
  }, [isMobile]);

  useEffect(() => {
    document.title = "Urban Flex Bela Cintra · Studios de 19 a 83 m² na Consolação";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Studios de 19 a 83 m² a 200m da Av. Paulista. Veja projetos de reforma 3D, compare opções de design e solicite seu orçamento. Entrega dez/2026.");
  }, []);

  const trustFacts = [
    { value: "Dez/2026", label: "Entrega" },
    { value: "63,5%", label: "Obra" },
    { value: "19–83 m²", label: "Tipologias" },
    { value: "2 opções", label: "Por planta" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AppNavbar />
      {isMobile && <MobileQuickNav />}

      {/* ── HERO — focado no comprador do studio ── */}
      <section
        ref={heroRef}
        className={`relative overflow-hidden flex flex-col ${
          isMobile ? "min-h-[85svh] justify-end" : "min-h-[100svh] justify-center"
        }`}
      >
        {/* Background image — parallax only on desktop */}
        {isMobile ? (
          <div className="absolute inset-0">
            <img src={heroImg} alt="Fachada LM Urban Flex Bela Cintra" className="h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-foreground/20" />
          </div>
        ) : (
          <motion.div className="absolute inset-0" style={{ y: heroImgY }}>
            <img src={heroImg} alt="Fachada LM Urban Flex Bela Cintra" className="h-[120%] w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/75 via-foreground/55 to-foreground/80" />
          </motion.div>
        )}

        <motion.div style={isMobile ? undefined : { opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-5 md:px-6 pt-24 pb-8 md:pt-36 md:pb-24 w-full">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Badge className="bg-accent/90 text-accent-foreground border-accent/40 hover:bg-accent backdrop-blur-sm mb-3 md:mb-5 text-[11px] md:text-xs font-bold tracking-wide px-3 py-1.5">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              {isMobile ? "Urban Flex · Consolação" : "LM Urban Flex · R. Bela Cintra, 209 — Consolação"}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[1.65rem] md:text-6xl lg:text-7xl font-bold leading-[1.12] md:leading-[1.02] max-w-4xl tracking-tight"
            style={{ color: "hsl(var(--primary-foreground))" }}
          >
            {isMobile ? (
              <>Seu studio na Paulista.{" "}<br /><span className="text-accent">Projetado para render.</span></>
            ) : (
              <>Seu studio a 200m da Paulista.{" "}<span className="text-accent">Projetado para rentabilizar.</span></>
            )}
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-3 md:mt-6 text-[14px] md:text-xl max-w-2xl leading-relaxed"
            style={{ color: "hsl(var(--primary-foreground) / 0.88)" }}
          >
            {isMobile
              ? "6 tipologias com projetos 3D baseados em dados reais de ocupação."
              : "6 tipologias de 19 a 83 m² com projetos de reforma 3D criados a partir de dados reais de ocupação e rentabilidade — cada detalhe pensado para o seu imóvel performar acima da média."
            }
          </motion.p>

          {/* Trust facts — compact row on mobile */}
          {isMobile ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
            >
              {trustFacts.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="font-display text-[13px] font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>{s.value}</span>
                  <span className="text-[11px]" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>{s.label}</span>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-16 flex flex-wrap gap-8 md:gap-14"
            >
              {[
                { value: "Dez/2026", label: "Previsão de entrega" },
                { value: "63,5%", label: "Obra concluída" },
                { value: "19–83 m²", label: "De studio a cobertura" },
                { value: "2 opções", label: "De reforma por planta" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
                >
                  <p className="font-display text-2xl md:text-3xl font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CTA — full-width on mobile, bottom-anchored */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-6 md:mt-10 flex flex-col sm:flex-row gap-3"
          >
            <a href="#tipologias" className="w-full sm:w-auto">
              <Button size="lg" className="min-h-[52px] w-full sm:w-auto text-base bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/25 active:scale-[0.97] transition-transform">
                <Eye className="mr-2 h-5 w-5" />
                Ver plantas e projetos 3D
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator — desktop only */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-5 h-8 rounded-full border-2 border-background/30 flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-1.5 rounded-full bg-background/60" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ── POR QUE ESTE IMÓVEL — redução de objeção ── */}
      <section className="border-b border-border/40 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-12 md:py-24 relative">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-3">Por que o Urban Flex</p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground max-w-3xl leading-tight">
              Localização, dados e design trabalhando juntos pelo seu retorno.
            </h2>
          </FadeIn>

          <div className="mt-8 md:mt-10 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                title: "Localização premium",
                desc: "Rua Bela Cintra, 209 — a 200m da Av. Paulista, entre metrô Consolação e Trianon-MASP.",
              },
              {
                icon: Sparkles,
                title: "Design orientado por dados",
                desc: "Studios com design estratégico alcançam até 30% mais ocupação que unidades sem reforma. Cada projeto 3D foi pensado para maximizar diária e taxa de reserva.",
              },
              {
                icon: Shield,
                title: "Obra em andamento",
                desc: "63,5% concluída, entrega prevista para dezembro de 2026. Retrofit com padrão construtivo Leal Moreira.",
              },
              {
                icon: TrendingUp,
                title: "Retorno validado",
                desc: cons
                  ? `Consolação tem ${cons.occupancyPercent}% de ocupação e diária média de ${formatBRL(cons.nightlyRateBRL)} para studios.`
                  : "Consolação é um dos bairros com melhor yield bruto de SP para short stay.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <Card className="h-full border-border/60 hover:border-accent/30 transition-colors active:scale-[0.98] active:border-accent/40">
                  <CardContent className="p-4 md:p-5 flex md:block items-start gap-3">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 md:mb-3">
                      <item.icon className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-[13px] md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>

          {/* Micro social proof */}
          <FadeIn delay={0.3}>
            <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-3 md:gap-4 text-[13px] md:text-sm text-muted-foreground">
              {[
                "Incorporadora Leal Moreira",
                "Operação short stay ready",
                "Amenidades completas no empreendimento",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  {t}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.35}>
            <p className="mt-4 text-[11px] text-muted-foreground/60">
              Fonte: AirDNA Market Minder, pesquisa Bwild 2025. Dados referentes a studios 20–35 m² na região da Consolação.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── TIPOLOGIAS (funil de conversão) ── */}
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <PlantasSection />
      </Suspense>

      {/* ── CONSOLAÇÃO vs OUTROS BAIRROS ── */}
      <section id="comparativo" className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-14 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Dados de mercado</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl">
              Consolação: um dos melhores yields de São Paulo.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              Diária competitiva com preço de aquisição abaixo de bairros vizinhos — a combinação que gera o melhor retorno para o investidor.
            </p>
          </FadeIn>

          {(() => {
            if (!cons) return null;
            const statsData = [
              { value: cons.adrRangeLabel, label: "Diária média (studios)", detail: cons.sourceLabel },
              { value: `${cons.occupancyPercent}%`, label: "Ocupação média anual", detail: "Acima da média de SP" },
              { value: `${cons.listingsCount.toLocaleString("pt-BR")}+`, label: "Listings ativos", detail: "Mercado validado" },
              { value: "R$ 10.500/m²", label: "Preço médio residencial", detail: "Abaixo de Pinheiros e Itaim" },
            ];
            return (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsData.map((stat, i) => (
                  <FadeIn key={stat.label} delay={i * 0.06}>
                    <div className="rounded-xl border border-border/60 bg-background p-5 h-full">
                      <p className="font-display text-xl md:text-2xl font-bold text-primary">{stat.value}</p>
                      <p className="text-sm font-medium text-foreground mt-2">{stat.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{stat.detail}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            );
          })()}

          {/* Comparative — cards on mobile, table on desktop */}
          <FadeIn className="mt-14">
            <Suspense fallback={<div className="min-h-[200px]" />}>
              <ComparativoRegional isMobile={isMobile} />
            </Suspense>
          </FadeIn>
        </div>
      </section>

      {/* ── GUIA DO INVESTIDOR ── */}
      <section id="guia" className="border-b border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.05] via-transparent to-accent/[0.03] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-14 md:py-28 relative">
          {/* Header — always visible */}
          <FadeIn>
            <Badge className="mb-3 md:mb-4 bg-accent/10 text-accent border-accent/20 hover:bg-accent/15 text-xs font-semibold tracking-wide px-3 py-1">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Ferramenta exclusiva
            </Badge>
            <h2 className="font-display text-[1.5rem] md:text-5xl font-bold text-foreground leading-[1.1] tracking-tight max-w-2xl">
              Guia do Investidor.{" "}
              <span className="text-accent">Tudo antes de comprar.</span>
            </h2>
            <p className="mt-2 md:mt-4 text-muted-foreground leading-relaxed max-w-lg text-[14px] md:text-base">
              Dados, critérios objetivos e análise — para decidir com segurança.
            </p>
          </FadeIn>

          {/* Desktop: 2-col grid (unchanged) */}
          {!isMobile && (
            <FadeIn delay={0.1} className="mt-10">
              <div className="grid grid-cols-2 gap-3">
                {guideItems.map((item) => (
                  <Link
                    key={item.title}
                    to={`/urban-flex-bela-cintra#${item.hash}`}
                    className="rounded-xl border border-border/60 bg-background p-4 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 block"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Mobile: vertical compact list — easier to scan, no carousel jank */}
          {isMobile && (
            <FadeIn delay={0.1} className="mt-5">
              <div className="space-y-2">
                {guideItems.map((item, i) => (
                  <Link
                    key={item.title}
                    to={`/urban-flex-bela-cintra#${item.hash}`}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3.5 active:scale-[0.98] active:border-accent/40 transition-all"
                  >
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold text-foreground leading-tight">{item.title}</h3>
                      <p className="text-[12px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </Link>
                ))}
              </div>
            </FadeIn>
          )}

          {/* CTA */}
          <FadeIn delay={0.2} className="mt-6 md:mt-10">
            <Link to="/urban-flex-bela-cintra">
              <Button size="lg" className="min-h-[52px] w-full sm:w-auto font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25 active:scale-[0.97] transition-transform">
                Acessar o Guia do Investidor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section>
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-14 md:py-28">
          <FadeIn className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground">
              Cada projeto foi desenhado para performar.
            </h2>
            <p className="mt-3 md:mt-4 text-muted-foreground text-[15px] md:text-lg leading-relaxed">
              Explore as plantas, veja os projetos pensados para alta rentabilidade e converse com a equipe comercial.
            </p>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="min-h-[52px] active:scale-[0.97] transition-transform" onClick={() => window.open(whatsappLink, "_blank")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com consultor
              </Button>
              <a href="#tipologias">
                <Button size="lg" variant="outline" className="min-h-[52px] w-full sm:w-auto active:scale-[0.97] transition-transform">
                  Ver plantas e projetos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer — extra bottom padding on mobile for sticky CTA */}
      <footer className="border-t border-border/40 bg-muted/25">
        <div className="max-w-7xl mx-auto px-5 md:px-6 py-6 md:py-8 pb-20 md:pb-8">
          <div className="flex flex-col items-center gap-3 md:gap-4 text-[13px] md:text-sm text-muted-foreground md:flex-row md:justify-between">
            <p>© 2026 Bwild. Todos os direitos reservados.</p>
            <nav aria-label="Links do rodapé" className="flex items-center gap-5">
              <Link to="/ferramentas" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">Ferramentas</Link>
              <Link to="/urban-flex-bela-cintra" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">Guia do Investidor</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ── */}
      <AnimatePresence>
        {isMobile && showStickyCta && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/40 px-4 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 12px)" }}
          >
            <a href="#tipologias" className="block">
              <Button size="lg" className="w-full min-h-[52px] text-base bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/25">
                <Eye className="mr-2 h-5 w-5" />
                Ver plantas e projetos 3D
              </Button>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}