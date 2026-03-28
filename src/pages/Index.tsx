import { useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Building2, MapPin, TrendingUp,
  MessageCircle, Wrench, BarChart3, Eye, Map,
  BrainCircuit, Palette, Calculator, Shield, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppNavbar from "@/components/AppNavbar";
import PlantasSection from "@/components/PlantasSection";
import heroImg from "@/assets/uf-fachada.jpeg";
import { DISTRICTS_MOCK, districtByName, formatBRL } from "@/data/districtMetrics";

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

const PLATFORM_PILLARS = [
  {
    icon: Palette,
    title: "Catálogo de Reforma 3D",
    desc: "6 tipologias com projetos decorados em duas linhas de design. Visualize antes de investir.",
    cta: "Ver tipologias",
    href: "#tipologias",
    accent: true,
  },
  {
    icon: Calculator,
    title: "Simulador de Retorno",
    desc: "Projete receita em cenários otimista e conservador com dados reais de mercado.",
    cta: "Simular agora",
    href: "/ferramentas",
  },
  {
    icon: Map,
    title: "Mapa de Inteligência",
    desc: "Heatmap de demanda, ranking de bairros e comparativo de yield por região de SP.",
    cta: "Explorar mapa",
    href: "/ferramentas",
  },
  {
    icon: BrainCircuit,
    title: "Insights de Vendas",
    desc: "Dashboard com performance por corretor, scripts de venda gerados por IA e calendário de eventos.",
    cta: "Ver insights",
    href: "/insights",
  },
];

export default function Index() {
  const heroStats = useMemo(() => {
    const avgDaily = Math.round(DISTRICTS_MOCK.reduce((s, d) => s + d.nightlyRateBRL, 0) / DISTRICTS_MOCK.length);
    const avgOcc = Math.round(DISTRICTS_MOCK.reduce((s, d) => s + d.occupancyPercent, 0) / DISTRICTS_MOCK.length);
    return { avgDaily, avgOcc, count: DISTRICTS_MOCK.length };
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    document.title = "Bwild · Investimento imobiliário inteligente em short stay";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Plataforma completa para investidores em studios short stay em São Paulo. Catálogo 3D, simulador de retorno, mapa de inteligência e insights de vendas.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[100svh] flex flex-col justify-center">
        {/* Parallax background */}
        <motion.div className="absolute inset-0" style={{ y: heroImgY }}>
          <img src={heroImg} alt="Fachada LM Urban Flex" className="h-[120%] w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/60 to-foreground/80" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16 md:pt-36 md:pb-24 w-full">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Badge className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/25 backdrop-blur-sm mb-6 text-xs font-bold tracking-wide px-3.5 py-1.5">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Plataforma completa para investidores
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.02] max-w-4xl tracking-tight"
            style={{ color: "hsl(var(--primary-foreground))" }}
          >
            Do projeto 3D ao{" "}
            <span className="text-accent">orçamento de reforma.</span>{" "}
            Tudo em um só lugar.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-lg md:text-xl max-w-2xl leading-relaxed"
            style={{ color: "hsl(var(--primary-foreground) / 0.85)" }}
          >
            Visualize reformas em 3D, simule retorno financeiro, analise bairros com dados reais
            e feche negócios com insights de venda — a plataforma que transforma dados em decisões de investimento.
          </motion.p>

          {/* Dual CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <a href="#tipologias">
              <Button size="lg" className="min-h-[52px] w-full sm:w-auto text-base bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/25">
                <Eye className="mr-2 h-5 w-5" />
                Ver projetos de reforma
              </Button>
            </a>
            <Link to="/ferramentas">
              <Button size="lg" variant="outline" className="min-h-[52px] w-full sm:w-auto text-base border-background/30 text-background hover:bg-background/10 hover:text-background backdrop-blur-sm font-semibold">
                Simular retorno
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-16 flex flex-wrap gap-8 md:gap-14"
          >
            {[
              { value: "6", label: "Tipologias com projeto 3D" },
              { value: `R$ ${heroStats.avgDaily}`, label: "Diária média (studios SP)" },
              { value: `${heroStats.avgOcc}%`, label: "Ocupação média anual" },
              { value: `${heroStats.count}+`, label: "Bairros com dados" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
              >
                <p className="font-display text-2xl md:text-3xl font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--primary-foreground) / 0.55)" }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
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
      </section>

      {/* ── PLATFORM PILLARS — what you can do ── */}
      <section className="border-b border-border/40 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-3">O que você pode fazer</p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground max-w-2xl leading-tight">
              Quatro módulos. Uma decisão mais inteligente.
            </h2>
          </FadeIn>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_PILLARS.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.08}>
                <Link to={p.href} className="block h-full">
                  <Card className={`h-full border-border/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    p.accent ? "border-accent/30 bg-accent/[0.03]" : ""
                  } hover:border-accent/40`}>
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${
                        p.accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
                      }`}>
                        <p.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-2">{p.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.desc}</p>
                      <span className="mt-4 text-sm font-semibold text-accent flex items-center gap-1 group">
                        {p.cta}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            ))}
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

      {/* Market location data — Consolação */}
      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Por que a Consolação</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl">
              Um dos bairros mais rentáveis de São Paulo para short stay.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              A Consolação concentra demanda corporativa, médica e turística em um raio de poucos quarteirões — o cenário ideal para ocupação alta e diárias consistentes.
            </p>
          </FadeIn>

          {(() => {
            const cons = districtByName.get("Consolação");
            if (!cons) return null;
            const statsData = [
              { value: cons.adrRangeLabel, label: "Diária média (studios)", detail: cons.sourceLabel },
              { value: `${cons.occupancyPercent}%`, label: "Ocupação média anual", detail: "Acima da média de SP" },
              { value: `${cons.listingsCount.toLocaleString("pt-BR")}+`, label: "Listings ativos na região", detail: "Mercado validado e líquido" },
              { value: "R$ 10.500/m²", label: "Preço médio residencial", detail: "Abaixo de Pinheiros e Itaim" },
            ];
            return (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Building2,
                title: "Corredor corporativo",
                text: "Av. Paulista, FIESP, hospitais Sírio-Libanês e 9 de Julho a menos de 1 km. Demanda constante de profissionais em trânsito.",
              },
              {
                icon: MapPin,
                title: "Infraestrutura completa",
                text: "3 estações de metrô em 10 min a pé (Consolação, Paulista, Trianon). Gastronomia, cultura e vida noturna que atraem turistas o ano todo.",
              },
              {
                icon: TrendingUp,
                title: "Potencial de valorização",
                text: "Preço/m² ainda abaixo de bairros vizinhos como Jardins e Itaim, com tendência de alta impulsionada por novos empreendimentos na região.",
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <Card className="card-elevated border-border/60 h-full">
                  <CardContent className="p-5">
                    <item.icon className="h-5 w-5 text-primary mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <PlantasSection />

      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          {/* Comparative table */}
          <FadeIn className="mt-14">
          {(() => {
            const VERDICTS: Record<string, string> = {
              "Consolação": "Melhor custo-benefício", "Pinheiros": "Diária alta, ticket elevado",
              "Itaim Bibi": "Premium, mas yield menor", "Vila Mariana": "Boa ocupação, ticket médio",
              "Moema": "Diária boa, preço alto", "República": "Ticket baixo, risco maior",
            };
            const names = ["Consolação", "Pinheiros", "Itaim Bibi", "Vila Mariana", "Moema", "República"];
            const rows = names.map((n) => {
              const d = districtByName.get(n);
              if (!d) return null;
              const priceSqm = d.priceSqm;
              const yieldEst = ((d.nightlyRateBRL * (d.occupancyPercent / 100) * 365) / (priceSqm * 30)) * 100;
              return {
                name: n,
                daily: formatBRL(d.nightlyRateBRL),
                occ: `${d.occupancyPercent}%`,
                price: `R$ ${priceSqm.toLocaleString("pt-BR")}`,
                yield: yieldEst.toFixed(1).replace(".", ",") + "%",
                yieldNum: yieldEst,
                highlight: n === "Consolação",
                verdict: VERDICTS[n] || "",
              };
            }).filter(Boolean) as Array<{ name: string; daily: string; occ: string; price: string; yield: string; yieldNum: number; highlight: boolean; verdict: string }>;

            const consYield = rows.find(r => r.name === "Consolação")?.yield || "";

            return (
              <FadeIn className="mt-14">
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                  Consolação vs. outros bairros
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Yield estimado considera diária média, ocupação e preço de aquisição por m². Quanto menor o ticket e maior a receita, melhor o retorno.
                </p>
                <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/30">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Bairro</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Diária média</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Ocupação</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Preço/m²</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Yield bruto est.</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">Veredito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.name}
                          className={`border-b border-border/20 last:border-0 ${row.highlight ? "bg-primary/5" : ""}`}
                        >
                          <td className={`py-3 px-4 font-medium ${row.highlight ? "text-primary font-bold" : "text-foreground"}`}>
                            {row.highlight && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />}
                            {row.name}
                          </td>
                          <td className="text-center py-3 px-4 text-muted-foreground">{row.daily}</td>
                          <td className="text-center py-3 px-4 text-muted-foreground">{row.occ}</td>
                          <td className="text-center py-3 px-4 text-muted-foreground">{row.price}</td>
                          <td className={`text-center py-3 px-4 font-bold ${row.highlight ? "text-primary" : "text-foreground"}`}>
                            {row.yield}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${row.highlight ? "bg-primary/10 text-primary font-semibold" : "bg-muted text-muted-foreground"}`}>
                              {row.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">O que é Yield bruto estimado?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O <strong className="text-foreground">yield bruto</strong> é a relação entre a receita anual de aluguel e o valor investido no imóvel — quanto maior, mais rápido o imóvel "se paga". O cálculo simplificado é: <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-border/60">(diária média × ocupação × 365) ÷ custo total do imóvel</span>.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A Consolação lidera com <strong className="text-primary">{consYield}</strong> porque combina dois fatores difíceis de encontrar juntos: <strong className="text-foreground">diária competitiva</strong> com um <strong className="text-foreground">preço de aquisição por m² significativamente menor</strong> que bairros vizinhos como Pinheiros e Itaim.
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-3">
                  Fonte: AirDNA, pesquisa Bwild 2025. Valores médios para studios 20–35 m².
                </p>
              </FadeIn>
            );
          })()}
          </FadeIn>
        </div>
      </section>

      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">Recursos para o investidor</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground max-w-2xl">
              Tome decisões baseadas em dados, não em achismo.
            </h2>
          </FadeIn>

          <div className="mt-12 max-w-xl mx-auto">
            <FadeIn delay={0.05}>
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
                    <Button className="w-full min-h-[44px] group-hover:bg-primary/90 transition-colors">
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
