import { useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Building2, MapPin, TrendingUp,
  MessageCircle, Wrench, BarChart3, Eye,
  CheckCircle2, Clock, Sparkles, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppNavbar from "@/components/AppNavbar";
import PlantasSection from "@/components/PlantasSection";
import heroImg from "@/assets/uf-fachada.jpeg";
import { DISTRICTS_MOCK, districtByName, formatBRL } from "@/data/districtMetrics";

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

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    document.title = "Urban Flex Bela Cintra · Studios de 19 a 83 m² na Consolação";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Studios de 19 a 83 m² a 200m da Av. Paulista. Veja projetos de reforma 3D, compare opções de design e solicite seu orçamento. Entrega dez/2026.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      {/* ── HERO — focado no comprador do studio ── */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[100svh] flex flex-col justify-center">
        <motion.div className="absolute inset-0" style={{ y: heroImgY }}>
          <img src={heroImg} alt="Fachada LM Urban Flex Bela Cintra" className="h-[120%] w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/75 via-foreground/55 to-foreground/80" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16 md:pt-36 md:pb-24 w-full">
          {/* Eyebrow — empreendimento */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Badge className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/25 backdrop-blur-sm mb-5 text-xs font-bold tracking-wide px-3.5 py-1.5">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              LM Urban Flex · R. Bela Cintra, 209 — Consolação
            </Badge>
          </motion.div>

          {/* Headline — proposta de valor para o comprador */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.02] max-w-4xl tracking-tight"
            style={{ color: "hsl(var(--primary-foreground))" }}
          >
            Seu studio a 200m da Paulista.{" "}
            <span className="text-accent">Já com reforma projetada.</span>
          </motion.h1>

          {/* Sub — benefício direto */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-lg md:text-xl max-w-2xl leading-relaxed"
            style={{ color: "hsl(var(--primary-foreground) / 0.85)" }}
          >
            Escolha entre 6 tipologias de 19 a 83 m², visualize os projetos de reforma em 3D
            e receba o orçamento pronto — tudo antes mesmo da entrega das chaves.
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
                Ver plantas e projetos 3D
              </Button>
            </a>
            <Button
              size="lg"
              variant="outline"
              className="min-h-[52px] w-full sm:w-auto text-base border-background/30 text-background hover:bg-background/10 hover:text-background backdrop-blur-sm font-semibold"
              onClick={() => window.open(whatsappLink, "_blank")}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Falar com consultor
            </Button>
          </motion.div>

          {/* Trust facts — específicos do empreendimento */}
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

      {/* ── POR QUE ESTE IMÓVEL — redução de objeção ── */}
      <section className="border-b border-border/40 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-3">Por que o Urban Flex</p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground max-w-3xl leading-tight">
              Um imóvel pensado para gerar renda desde o primeiro dia.
            </h2>
          </FadeIn>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                title: "Localização premium",
                desc: "Rua Bela Cintra, 209 — a 200m da Av. Paulista, entre metrô Consolação e Trianon-MASP.",
              },
              {
                icon: Sparkles,
                title: "Reforma projetada",
                desc: "Projetos 3D prontos com 2 linhas de design por planta. Você visualiza o resultado antes de decidir.",
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
                <Card className="h-full border-border/60 hover:border-accent/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>

          {/* Micro social proof */}
          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
        </div>
      </section>

      {/* ── TIPOLOGIAS (funil de conversão) ── */}
      <PlantasSection />

      {/* ── CONSOLAÇÃO vs OUTROS BAIRROS ── */}
      <section className="bg-muted/25 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
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
                <>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                    Consolação vs. outros bairros
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Yield estimado considera diária média, ocupação e preço de aquisição por m².
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
                      O <strong className="text-foreground">yield bruto</strong> é a relação entre a receita anual de aluguel e o valor investido — quanto maior, mais rápido o imóvel "se paga". Cálculo: <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-border/60">(diária × ocupação × 365) ÷ custo do imóvel</span>.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A Consolação lidera com <strong className="text-primary">{consYield}</strong> porque combina <strong className="text-foreground">diária competitiva</strong> com <strong className="text-foreground">preço de aquisição por m² menor</strong> que vizinhos como Pinheiros e Itaim.
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 mt-3">
                    Fonte: AirDNA, pesquisa Bwild 2025. Valores médios para studios 20–35 m².
                  </p>
                </>
              );
            })()}
          </FadeIn>
        </div>
      </section>

      {/* ── GUIA DO INVESTIDOR ── */}
      <section className="border-b border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.02] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 relative">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
            <FadeIn>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 hover:bg-accent/15 text-xs font-semibold tracking-wide px-3 py-1">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                Ferramenta exclusiva
              </Badge>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
                Guia do Investidor.{" "}
                <span className="text-accent">Tudo antes de comprar.</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
                Um hub técnico completo para você tomar a melhor decisão — sem jargão comercial, 
                só dados, critérios objetivos e análise de mercado.
              </p>

              <Link to="/urban-flex-bela-cintra" className="mt-8 inline-block">
                <Button size="lg" className="min-h-[52px] font-bold">
                  Acessar o Guia do Investidor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: "Quiz de Perfil", desc: "Descubra qual tipologia combina com seu objetivo de investimento." },
                  { title: "Checklist de Escolha", desc: "16 critérios técnicos para avaliar o imóvel com clareza." },
                  { title: "Simulador de Retorno", desc: "Projete receita em cenários otimista e conservador." },
                  { title: "Checklist de Prontidão", desc: "10 itens para garantir que você está pronto para fechar." },
                  { title: "Análise de Bairro", desc: "Dados de ocupação, diária e yield da Consolação vs. concorrentes." },
                  { title: "Estratégia de Renda", desc: "Como operar short stay e maximizar retorno desde o dia 1." },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border/60 bg-background p-4 hover:border-primary/30 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <FadeIn className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Pronto para conhecer seu futuro studio?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Explore as plantas, veja os projetos de reforma e converse com a equipe comercial.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="min-h-[48px]" onClick={() => window.open(whatsappLink, "_blank")}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar com consultor
              </Button>
              <a href="#tipologias">
                <Button size="lg" variant="outline" className="min-h-[48px] w-full sm:w-auto">
                  Ver plantas e projetos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
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
              <Link to="/urban-flex-bela-cintra" className="hover:text-foreground transition-colors">Guia do Investidor</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}