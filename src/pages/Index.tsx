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
import heroImg from "@/assets/uf-fachada.jpeg";

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
              <Link to="/ferramentas">
                <Button size="lg" className="min-h-[48px] w-full sm:w-auto">
                  Explorar Ferramentas
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

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "R$ 260–390", label: "Diária média (studios)", detail: "Airbnb / Booking · 2025" },
              { value: "76%", label: "Ocupação média anual", detail: "Acima da média de SP" },
              { value: "350+", label: "Listings ativos na região", detail: "Mercado validado e líquido" },
              { value: "R$ 10.500/m²", label: "Preço médio residencial", detail: "Abaixo de Pinheiros e Itaim" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.06}>
                <div className="rounded-xl border border-border/60 bg-background p-5 h-full">
                  <p className="font-display text-xl md:text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground mt-2">{stat.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{stat.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>

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

          {/* Comparative table */}
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
                  {[
                    { name: "Consolação", daily: "R$ 310", occ: "76%", price: "R$ 10.500", yield: "11,8%", highlight: true, verdict: "Melhor custo-benefício" },
                    { name: "Pinheiros", daily: "R$ 380", occ: "82%", price: "R$ 14.000", yield: "8,1%", highlight: false, verdict: "Diária alta, ticket elevado" },
                    { name: "Itaim Bibi", daily: "R$ 420", occ: "78%", price: "R$ 16.000", yield: "7,2%", highlight: false, verdict: "Premium, mas yield menor" },
                    { name: "Vila Mariana", daily: "R$ 330", occ: "80%", price: "R$ 12.500", yield: "7,7%", highlight: false, verdict: "Boa ocupação, ticket médio" },
                    { name: "Moema", daily: "R$ 360", occ: "77%", price: "R$ 14.500", yield: "7,0%", highlight: false, verdict: "Diária boa, preço alto" },
                    { name: "República", daily: "R$ 245", occ: "72%", price: "R$ 8.200", yield: "7,8%", highlight: false, verdict: "Ticket baixo, risco maior" },
                  ].map((row) => (
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
                A Consolação lidera com <strong className="text-primary">11,8%</strong> porque combina dois fatores difíceis de encontrar juntos: <strong className="text-foreground">diária competitiva</strong> (R$ 310) com um <strong className="text-foreground">preço de aquisição por m² significativamente menor</strong> que bairros vizinhos como Pinheiros (R$ 14k) e Itaim (R$ 16k). Mesmo com ocupação ligeiramente inferior, o ticket de entrada mais baixo faz o retorno percentual ser até 64% maior do que no Itaim Bibi.
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-3">
              Fonte: AirDNA, pesquisa Bwild 2025. Valores médios para studios 20–35 m².
            </p>
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
            <p>© 2025 Bwild. Todos os direitos reservados.</p>
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
