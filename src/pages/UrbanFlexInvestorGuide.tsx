import { useEffect, useMemo, useState, type ReactNode } from "react";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import MarketIntelSection from "@/components/MarketIntelSection";
import PropertySimuladorSection from "@/components/ferramentas/PropertySimuladorSection";
import PropertyDiagnosticoSection from "@/components/ferramentas/PropertyDiagnosticoSection";
import RentabilidadeSection from "@/components/guide/RentabilidadeSection";
import EscolhaAtivoSection from "@/components/guide/EscolhaAtivoSection";
import CaseStudySection from "@/components/guide/CaseStudySection";
import ChecklistSection from "@/components/guide/ChecklistSection";
import TrustSignalsSection from "@/components/guide/TrustSignalsSection";
import { motion } from "framer-motion";
import AppNavbar from "@/components/AppNavbar";
import { cn } from "@/lib/utils";
import { FAQ_DATA } from "@/data/guide-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  ChevronRight,
  CircleDollarSign,
  Coffee,
  Compass,
  Hammer,
  HeartPulse,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Store,
  TrainFront,
  Trees,
  TrendingUp,
  Users,
} from "lucide-react";

type SectionId =
  | "hero"
  | "diagnostico"
  | "visao-geral"
  | "tipologias"
  | "rentabilidade"
  | "simulador"
  | "escolha-ativo"
  | "localizacao"
  | "amenidades"
  | "obra"
  | "casestudy"
  | "checklist-final"
  | "faq"
  | "contato";

type UnitType = {
  id: string;
  title: string;
  areaLabel: string;
  areaNum: number;
  priceFrom: number;
  furnishingBudget: number;
  dailyMin: number;
  dailyMax: number;
  occupancyBase: number;
  tag?: string;
  blurb: string;
  positioning: string;
};

type Amenity = {
  title: string;
  icon: typeof Coffee;
  text: string;
};

type NearbyPoint = {
  name: string;
  distance: string;
  icon: typeof MapPin;
  text: string;
};

type BuildStage = {
  label: string;
  value: number;
};

type FurnishingLevel = "essencial" | "premium" | "signature";

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "hero", label: "Início" },
  { id: "diagnostico", label: "Perfil" },
  { id: "visao-geral", label: "Tese" },
  { id: "tipologias", label: "Tipologias" },
  { id: "rentabilidade", label: "Matemática" },
  { id: "simulador", label: "Simulador" },
  { id: "escolha-ativo", label: "Avaliação" },
  { id: "localizacao", label: "Localização" },
  { id: "amenidades", label: "Amenidades" },
  { id: "obra", label: "Obra" },
  { id: "casestudy", label: "Case" },
  { id: "checklist-final", label: "Checklist" },
  { id: "faq", label: "FAQ" },
  { id: "contato", label: "Contato" },
];

const unitTypes: UnitType[] = [
  {
    id: "studio-compacto",
    title: "Studio compacto",
    areaLabel: "18 a 20 m²",
    areaNum: 19,
    priceFrom: 280000,
    furnishingBudget: 28000,
    dailyMin: 220,
    dailyMax: 340,
    occupancyBase: 78,
    tag: "Entrada mais leve",
    blurb: "Produto de giro rápido para investidor que quer liquidez, tíquete de entrada mais baixo e operação simples.",
    positioning: "Melhor ponto de partida para short stay com apelo corporativo e urbano.",
  },
  {
    id: "apartamento-flex",
    title: "Apartamento flex",
    areaLabel: "38 a 83 m²",
    areaNum: 46,
    priceFrom: 520000,
    furnishingBudget: 52000,
    dailyMin: 350,
    dailyMax: 520,
    occupancyBase: 74,
    tag: "Ticket médio premium",
    blurb: "Combina versatilidade de uso com diárias mais altas e perfil de hóspede que aceita permanências mais longas.",
    positioning: "Boa opção para elevar receita por reserva sem depender só de alta ocupação.",
  },
  {
    id: "duplex-signature",
    title: "Studio duplex",
    areaLabel: "63 a 76 m²",
    areaNum: 69,
    priceFrom: 780000,
    furnishingBudget: 92000,
    dailyMin: 480,
    dailyMax: 700,
    occupancyBase: 70,
    tag: "Produto assinatura",
    blurb: "Tipologia diferenciada para operação premium, estadas mais completas e narrativa de produto com maior valor percebido.",
    positioning: "Ideal para estratégia de margem maior e posicionamento boutique.",
  },
  {
    id: "garden-exclusivo",
    title: "Apartamento garden",
    areaLabel: "41 a 61 m²",
    areaNum: 49,
    priceFrom: 600000,
    furnishingBudget: 65000,
    dailyMin: 380,
    dailyMax: 560,
    occupancyBase: 72,
    tag: "Estoque raro",
    blurb: "Unidade de apelo emocional mais forte, indicada para narrativa de exclusividade e diferenciação no anúncio.",
    positioning: "Ajuda a fugir da guerra de preço quando bem operado e decorado.",
  },
];

const amenities: Amenity[] = [
  {
    title: "Coffee",
    icon: Coffee,
    text: "Amenidade que melhora a experiência do hóspede e reforça a proposta urbana do retrofit.",
  },
  {
    title: "Conveniência",
    icon: Store,
    text: "Facilidade para estadias curtas, reduzindo fricção no dia a dia de quem chega a trabalho ou lazer.",
  },
  {
    title: "Coworking + reunião",
    icon: BriefcaseBusiness,
    text: "Fortalece a tese de demanda corporativa e aumenta aderência ao público executivo.",
  },
  {
    title: "Lavanderia",
    icon: Users,
    text: "Suporte importante para estadias flexíveis e permanências acima da média tradicional de hotel.",
  },
  {
    title: "Lobby",
    icon: Building2,
    text: "Primeira impressão premium, relevante para percepção de valor e reputação do empreendimento.",
  },
  {
    title: "Lounge / convivência",
    icon: Compass,
    text: "Cria atmosfera de produto contemporâneo, mais alinhada ao perfil short stay premium.",
  },
];

const nearbyPoints: NearbyPoint[] = [
  {
    name: "Av. Paulista",
    distance: "200 m",
    icon: MapPin,
    text: "Âncora de demanda corporativa, médica, cultural e turística.",
  },
  {
    name: "Metrô Consolação",
    distance: "350 m",
    icon: TrainFront,
    text: "Mobilidade alta para hóspedes sem carro e reservas de última hora.",
  },
  {
    name: "Metrô Paulista",
    distance: "400 m",
    icon: TrainFront,
    text: "Conecta o ativo a vários polos de negócios e lazer da cidade.",
  },
  {
    name: "MASP / circuito cultural",
    distance: "450 m",
    icon: Compass,
    text: "Ajuda a sustentar também a demanda de fim de semana e eventos.",
  },
  {
    name: "Parque Trianon",
    distance: "500 m",
    icon: Trees,
    text: "Melhora experiência do entorno e repertório do anúncio.",
  },
  {
    name: "Sírio-Libanês",
    distance: "1,2 km",
    icon: HeartPulse,
    text: "Demanda complementar de saúde, acompanhantes e profissionais.",
  },
];

const buildStages: BuildStage[] = [
  { label: "Status geral", value: 63.53 },
  { label: "Projeto", value: 100 },
  { label: "Lançamento", value: 100 },
  { label: "Fundação", value: 100 },
  { label: "Estrutura", value: 100 },
  { label: "Vedações", value: 100 },
  { label: "Revestimento", value: 72.82 },
  { label: "Fachada", value: 74.34 },
  { label: "Acabamento", value: 33.39 },
];

const faqItems = [
  {
    question: "Essa página substitui o material comercial oficial?",
    answer:
      "Não. Ela funciona como uma página de captura e pré-venda para o investidor. Os números do simulador são sementes editáveis para a equipe comercial refinar com tabela, fluxo de pagamento e estudo de operação.",
  },
  {
    question: "Quais números eu preciso validar antes de publicar?",
    answer:
      "Preço por tipologia, estoque disponível, política comercial, cronograma de obra, taxa condominial estimada e qualquer dado oficial de short stay ou gestão integrada que a incorporadora queira assumir publicamente.",
  },
  {
    question: "Posso usar essa página como landing dedicada?",
    answer:
      "Sim. A estrutura foi pensada para funcionar tanto como rota interna do projeto quanto como landing de mídia paga, com hero direto, simulador, prova de localização, estágio de obra e CTA comercial forte.",
  },
  {
    question: "Como adaptar para outra incorporadora ou outro empreendimento?",
    answer:
      "Troque os blocos de dados no topo do arquivo: tipologias, amenidades, pontos de entorno, progresso de obra, texto do hero e link de WhatsApp. A página foi montada para esse tipo de reaproveitamento.",
  },
];

const whatsappLink =
  "https://wa.me/5591984804821?text=Olá!%20Vi%20a%20página%20de%20guia%20do%20investidor%20do%20Urban%20Flex%20Bela%20Cintra%20e%20quero%20falar%20sobre%20uma%20unidade.";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currency.format(value);
}

function midpoint(min: number, max: number) {
  return (min + max) / 2;
}

function stageTone(value: number) {
  if (value >= 90) return "text-emerald-600";
  if (value >= 70) return "text-primary";
  return "text-amber-600";
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80 mb-3">{children}</p>;
}

function KpiCard({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <Card className={cn("card-elevated border-border/60", highlight && "border-primary/20 bg-primary/5")}>
      <CardContent className="p-5">
        <p className={cn("font-display text-3xl font-bold leading-none", highlight ? "text-primary" : "text-foreground")}>
          {value}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function UrbanFlexInvestorGuide() {
  const [selectedType, setSelectedType] = useState<string>(unitTypes[0].id);
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const [occupancy, setOccupancy] = useState<number[]>([75]);
  const [dailyRateInput, setDailyRateInput] = useState<string>("");
  const [acquisitionInput, setAcquisitionInput] = useState<string>("");
  const [fitoutInput, setFitoutInput] = useState<string>("");
  const [fixedCostsInput, setFixedCostsInput] = useState<string>("");
  const [furnishingLevel, setFurnishingLevel] = useState<FurnishingLevel>("premium");

  const selectedUnit = unitTypes.find((item) => item.id === selectedType) ?? unitTypes[0];

  useEffect(() => {
    const ids = sections.map((section) => section.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id as SectionId);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.15, 0.35, 0.65],
      },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const simulation = useMemo(() => {
    const furnishingMultiplier =
      furnishingLevel === "essencial" ? 1 : furnishingLevel === "premium" ? 1.15 : 1.28;

    const avgDaily = dailyRateInput
      ? Number(dailyRateInput)
      : midpoint(selectedUnit.dailyMin, selectedUnit.dailyMax) * furnishingMultiplier;

    const bookedNights = 30 * (occupancy[0] / 100);
    const grossRevenue = avgDaily * bookedNights;
    const platformFee = grossRevenue * 0.15;
    const cleaning = bookedNights * 95;
    const fixedCosts = fixedCostsInput ? Number(fixedCostsInput) : Math.round(selectedUnit.areaNum * 35);
    const acquisition = acquisitionInput ? Number(acquisitionInput) : selectedUnit.priceFrom;
    const fitout = fitoutInput ? Number(fitoutInput) : selectedUnit.furnishingBudget;
    const totalInvestment = acquisition + fitout;
    const netRevenue = grossRevenue - platformFee - cleaning - fixedCosts;
    const annualNetRevenue = netRevenue * 12;
    const yieldPct = totalInvestment > 0 ? (annualNetRevenue / totalInvestment) * 100 : 0;
    const paybackYears = annualNetRevenue > 0 ? totalInvestment / annualNetRevenue : null;

    return {
      avgDaily,
      bookedNights,
      grossRevenue,
      platformFee,
      cleaning,
      fixedCosts,
      acquisition,
      fitout,
      totalInvestment,
      netRevenue,
      annualNetRevenue,
      yieldPct,
      paybackYears,
    };
  }, [selectedUnit, occupancy, dailyRateInput, acquisitionInput, fitoutInput, fixedCostsInput, furnishingLevel]);

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <GuideDecisionProvider>
    <div className="min-h-screen bg-background page-enter">
      <AppNavbar />

      <div className="sticky top-16 z-30 glass-nav border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max py-3">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollTo(section.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="pb-24">
        <section id="hero" className="scroll-mt-32 border-b border-border/50 bg-hero-gradient-subtle">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-wrap gap-2 mb-5">
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Leal Moreira</Badge>
                  <Badge variant="outline">LM Urban Flex · Bela Cintra</Badge>
                  <Badge variant="outline">Página para investidor</Badge>
                </div>

                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground max-w-4xl">
                  Uma página de guia do investidor para vender
                  <span className="text-gradient-premium"> short stay premium </span>
                  na Bela Cintra.
                </h1>

                <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
                  Estruture a conversa comercial em torno de tese, localização, tipologia, obra e retorno potencial.
                  Esta versão foi montada para encaixar no projeto atual da Bwild e traduzir o empreendimento em uma
                  narrativa mais útil para quem compra pensando em renda.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="min-h-[46px]" onClick={() => scrollTo("simulador")}>
                    <CircleDollarSign className="mr-2 h-4 w-4" />
                    Simular retorno
                  </Button>
                  <Button size="lg" variant="outline" className="min-h-[46px]" onClick={() => window.open(whatsappLink, "_blank")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar com consultor
                  </Button>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard value="R. Bela Cintra, 209" label="Endereço do empreendimento" />
                  <KpiCard value="18 a 83 m²" label="Faixa de tipologias" />
                  <KpiCard value="63,53%" label="Status geral da obra" highlight />
                  <KpiCard value="6 áreas" label="Amenidades-chave no material público" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.55, delay: 0.1 }}
              >
                <Card className="card-elevated overflow-hidden border-primary/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-2xl">Resumo da tese</CardTitle>
                        <CardDescription className="mt-2">
                          O que a página precisa comunicar logo de cara para converter melhor.
                        </CardDescription>
                      </div>
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {[
                      "Endereço ultra conhecido e de leitura imediata para o investidor: Bela Cintra + Paulista.",
                      "Tipologias variadas para trabalhar desde entrada mais leve até produto premium assinatura.",
                      "Amenidades que ajudam a sustentar a narrativa de short stay urbano e operação mais conveniente.",
                      "Bloco de obra e cronograma para reduzir objeção de timing na venda.",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <p className="text-sm leading-relaxed text-foreground">{item}</p>
                      </div>
                    ))}

                    <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Dica de produto: use esta rota como landing dedicada de mídia e também como apoio para o time
                        comercial em atendimento 1:1.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="visao-geral" className="scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <SectionLabel>Tese comercial</SectionLabel>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  O investidor não compra só metragem. Ele compra contexto, fluidez de operação e narrativa de renda.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Esta página foi desenhada para organizar a decisão em uma sequência simples: por que esse ativo faz
                  sentido, qual tipologia encaixa no perfil do comprador, como fica uma conta preliminar de retorno e por
                  que o entorno ajuda a sustentar a ocupação.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    icon: TrendingUp,
                    title: "Tese de renda",
                    text: "A página precisa levar o usuário rapidamente da curiosidade para uma leitura clara de potencial de diária, ocupação e margem.",
                  },
                  {
                    icon: LayoutGrid,
                    title: "Tese de produto",
                    text: "Mostrar tipologias e diferenciais do retrofit ajuda a sair do discurso genérico de studio e posicionar melhor cada unidade.",
                  },
                  {
                    icon: Compass,
                    title: "Tese de localização",
                    text: "Bela Cintra e Paulista já comunicam demanda em poucos segundos. O papel do layout é dar lastro a essa intuição.",
                  },
                  {
                    icon: Hammer,
                    title: "Tese de timing",
                    text: "O estágio de obra reduz objeção e ajuda o corretor a conduzir urgência e previsibilidade na conversa comercial.",
                  },
                ].map((item) => (
                  <Card key={item.title} className="card-elevated h-full border-border/60">
                    <CardContent className="p-5">
                      <item.icon className="h-5 w-5 text-primary mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="tipologias" className="scroll-mt-32 bg-muted/25 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <SectionLabel>Tipologias</SectionLabel>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Escolha a unidade-base da simulação</h2>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                  Os cards abaixo já vêm com valores-semente inspirados no draft comercial. Você pode trocar preço, capex
                  e diária manualmente no simulador sem mexer na estrutura da página.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                Dados facilmente editáveis no topo do arquivo
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {unitTypes.map((unit) => {
                const isActive = unit.id === selectedType;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setSelectedType(unit.id)}
                    className="text-left"
                  >
                    <Card
                      className={cn(
                        "card-interactive h-full border-border/60 transition-all",
                        isActive && "border-primary shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]",
                      )}
                    >
                      <CardContent className="p-5 flex h-full flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{unit.areaLabel}</p>
                            <h3 className="mt-2 text-xl font-semibold text-foreground">{unit.title}</h3>
                          </div>
                          {unit.tag ? <Badge className="bg-primary/10 text-primary border-primary/15 hover:bg-primary/10">{unit.tag}</Badge> : null}
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{unit.blurb}</p>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg bg-secondary/70 p-3">
                            <p className="text-muted-foreground">Preço semente</p>
                            <p className="mt-1 font-semibold text-foreground">{formatCurrency(unit.priceFrom)}</p>
                          </div>
                          <div className="rounded-lg bg-secondary/70 p-3">
                            <p className="text-muted-foreground">Diária base</p>
                            <p className="mt-1 font-semibold text-foreground">
                              {formatCurrency(unit.dailyMin)} a {formatCurrency(unit.dailyMax)}
                            </p>
                          </div>
                        </div>

                        <p className="mt-auto pt-5 text-sm text-foreground flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          {unit.positioning}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="simulador" className="scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <SectionLabel>Simulador do investidor</SectionLabel>
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="card-elevated border-border/60">
                <CardHeader>
                  <CardTitle className="text-2xl">Ajuste os números da conversa comercial</CardTitle>
                  <CardDescription>
                    O objetivo aqui não é prometer retorno. É transformar uma conversa vaga em uma projeção compreensível.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <label className="text-sm font-medium text-foreground">Ocupação estimada</label>
                      <span className="text-sm font-semibold text-primary">{occupancy[0]}%</span>
                    </div>
                    <Slider value={occupancy} onValueChange={setOccupancy} min={45} max={95} step={1} />
                    <p className="mt-2 text-xs text-muted-foreground">Use uma faixa conservadora para conversas iniciais e ajuste depois por cenário.</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Padrão de mobiliário / acabamento</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "essencial", label: "Essencial" },
                        { id: "premium", label: "Premium" },
                        { id: "signature", label: "Signature" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setFurnishingLevel(option.id as FurnishingLevel)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            furnishingLevel === option.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Diária média manual</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder={`${Math.round(midpoint(selectedUnit.dailyMin, selectedUnit.dailyMax))}`}
                        value={dailyRateInput}
                        onChange={(event) => setDailyRateInput(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Preço da unidade</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder={`${selectedUnit.priceFrom}`}
                        value={acquisitionInput}
                        onChange={(event) => setAcquisitionInput(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Capex de enxoval / decoração</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder={`${selectedUnit.furnishingBudget}`}
                        value={fitoutInput}
                        onChange={(event) => setFitoutInput(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Custos fixos mensais</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder={`${Math.round(selectedUnit.areaNum * 35)}`}
                        value={fixedCostsInput}
                        onChange={(event) => setFixedCostsInput(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Leitura recomendada para o comercial:</strong> use o card de resultado como
                    “ordem de grandeza”. Depois, refine o cenário com tabela oficial, fluxo, condomínio, IPTU e premissas de operação.
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elevated border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl">Resultado estimado</CardTitle>
                      <CardDescription className="mt-1">
                        Cenário atual para <strong className="text-foreground">{selectedUnit.title}</strong>
                      </CardDescription>
                    </div>
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                      {selectedUnit.areaLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard value={formatCurrency(simulation.avgDaily)} label="Diária média" highlight />
                    <KpiCard value={formatCurrency(simulation.netRevenue)} label="Líquido mensal" />
                    <KpiCard value={formatCurrency(simulation.annualNetRevenue)} label="Líquido anual" />
                    <KpiCard value={`${simulation.yieldPct.toFixed(1)}% a.a.`} label="Yield estimado" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 p-5">
                      <p className="text-sm font-semibold text-foreground mb-4">Composição da receita</p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Noites ocupadas / mês</span>
                          <span className="font-semibold text-foreground">{simulation.bookedNights.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Receita bruta</span>
                          <span className="font-semibold text-foreground">{formatCurrency(simulation.grossRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Taxa de plataforma (15%)</span>
                          <span className="font-semibold text-foreground">-{formatCurrency(simulation.platformFee)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Limpeza operacional</span>
                          <span className="font-semibold text-foreground">-{formatCurrency(simulation.cleaning)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Custos fixos</span>
                          <span className="font-semibold text-foreground">-{formatCurrency(simulation.fixedCosts)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-base">
                          <span className="font-semibold text-foreground">Líquido mensal</span>
                          <span className="font-display text-xl font-bold text-primary">{formatCurrency(simulation.netRevenue)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 p-5">
                      <p className="text-sm font-semibold text-foreground mb-4">Composição do investimento</p>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Aquisição</span>
                          <span className="font-semibold text-foreground">{formatCurrency(simulation.acquisition)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Decoração / enxoval</span>
                          <span className="font-semibold text-foreground">{formatCurrency(simulation.fitout)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-base">
                          <span className="font-semibold text-foreground">Investimento total</span>
                          <span className="font-display text-xl font-bold text-foreground">
                            {formatCurrency(simulation.totalInvestment)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-muted-foreground">Payback estimado</span>
                          <span className="font-semibold text-foreground">
                            {simulation.paybackYears ? `${simulation.paybackYears.toFixed(1)} anos` : "—"}
                          </span>
                        </div>
                        <div className="rounded-lg bg-secondary/70 p-4 mt-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Observação importante</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Yield e payback variam com gestão, sazonalidade, mix de canais, condomínio, IPTU, vacancy e qualidade do anúncio.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="min-h-[46px]" onClick={() => window.open(whatsappLink, "_blank")}>
                      Quero falar sobre essa tipologia
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="min-h-[46px]" onClick={() => scrollTo("contato")}>
                      Levar para CTA final
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="localizacao" className="scroll-mt-32 bg-muted/25 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <SectionLabel>Localização</SectionLabel>
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  A força comercial aqui começa pelo endereço.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                  Em vez de falar só em “São Paulo”, a página encara o que realmente ajuda a vender: Bela Cintra,
                  Consolação e Paulista são referências que comprimem a explicação do ativo e facilitam a leitura de demanda.
                </p>

                <div className="mt-6 rounded-2xl border border-border/60 bg-background p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Endereço</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">Rua Bela Cintra, 209 — São Paulo/SP</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-secondary/70 p-4">
                      <p className="text-sm font-semibold text-foreground">Leitura para o investidor</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Endereço com forte repertório urbano, boa conexão de transporte e apelo para público corporativo,
                        médico, cultural e de lazer.
                      </p>
                    </div>
                    <div className="rounded-xl bg-secondary/70 p-4">
                      <p className="text-sm font-semibold text-foreground">Leitura para mídia</p>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        A comunicação ganha muito quando o anúncio parte de “200 m da Paulista” em vez de depender só de um texto institucional longo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {nearbyPoints.map((point) => (
                  <Card key={point.name} className="card-elevated border-border/60 h-full">
                    <CardContent className="p-5">
                      <point.icon className="h-5 w-5 text-primary mb-3" />
                      <p className="font-display text-2xl font-bold text-foreground">{point.distance}</p>
                      <h3 className="mt-1 font-semibold text-foreground">{point.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{point.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="amenidades" className="scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <SectionLabel>Amenidades</SectionLabel>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">O discurso de produto precisa conversar com a operação</h2>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                  Mais do que “lista de áreas comuns”, este bloco mostra por que as amenidades ajudam a defender a tese de flexibilidade, conveniência e percepção premium.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">Bloco ótimo para criativo e argumento de corretor</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {amenities.map((amenity) => (
                <Card key={amenity.title} className="card-elevated border-border/60 h-full">
                  <CardContent className="p-5">
                    <amenity.icon className="h-5 w-5 text-primary mb-3" />
                    <h3 className="text-lg font-semibold text-foreground">{amenity.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{amenity.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="obra" className="scroll-mt-32 bg-muted/25 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <SectionLabel>Obra</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Estágio de obra como argumento de confiança</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Esse bloco ajuda muito na venda porque tira a conversa do abstrato. Ele mostra que o ativo tem evolução concreta e permite ao time comercial trabalhar segurança e timing com mais clareza.
                </p>

                <Card className="mt-6 border-primary/15 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <CalendarRange className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Leitura rápida</p>
                        <p className="font-display text-3xl font-bold text-primary">63,53%</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Projeto, lançamento, fundação, estrutura e vedações aparecem concluídos no material público, com revestimento e fachada já avançados.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="card-elevated border-border/60">
                <CardHeader>
                  <CardTitle className="text-2xl">Quadro de progresso</CardTitle>
                  <CardDescription>Use esses indicadores como bloco de confiança e atualização comercial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buildStages.map((stage) => (
                    <div key={stage.label}>
                      <div className="flex items-center justify-between gap-3 mb-2 text-sm">
                        <span className="font-medium text-foreground">{stage.label}</span>
                        <span className={cn("font-semibold", stageTone(stage.value))}>{stage.value.toFixed(2)}%</span>
                      </div>
                      <Progress value={stage.value} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Ferramentas integradas */}
        <section className="scroll-mt-32 border-t border-border/40 bg-muted/25">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <MarketIntelSection />
          </div>
        </section>

        <section className="scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <PropertySimuladorSection />
          </div>
        </section>

        <section id="faq" className="scroll-mt-32">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">Perguntas que vale responder antes da publicação</h2>

            <Card className="card-elevated border-border/60">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="px-6">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={item.question} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-base">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="contato" className="scroll-mt-32 border-t border-border/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20">
            <Card className="overflow-hidden border-primary/15 bg-hero-gradient-subtle">
              <CardContent className="p-8 md:p-10">
                <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                  <div>
                    <SectionLabel>CTA final</SectionLabel>
                    <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground max-w-3xl">
                      Página pronta para vender melhor a tese de investimento, não só a unidade.
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                      Aqui o corretor ou mídia levam o investidor para uma ação simples: pedir tabela, validar disponibilidade e discutir a tipologia certa para o objetivo de renda.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                      <Button size="lg" className="min-h-[48px]" onClick={() => window.open(whatsappLink, "_blank")}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Quero falar com a equipe comercial
                      </Button>
                      <Button size="lg" variant="outline" className="min-h-[48px]" onClick={() => window.location.href = "tel:+5591984804821"}>
                        <Phone className="mr-2 h-4 w-4" />
                        Ligar agora
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <Card className="border-border/60 bg-background/90 backdrop-blur-sm">
                      <CardContent className="p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sugestão de uso</p>
                        <p className="mt-2 text-sm text-foreground leading-relaxed">
                          Ideal como rota dedicada, como apoio ao corretor e também como destino de anúncios de captação de investidores.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-background/90 backdrop-blur-sm">
                      <CardContent className="p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Personalização rápida</p>
                        <p className="mt-2 text-sm text-foreground leading-relaxed">
                          Se quiser, troque apenas o bloco de dados no topo do arquivo e você já reaproveita toda a estrutura para outro lançamento.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
    </GuideDecisionProvider>
  );
}
