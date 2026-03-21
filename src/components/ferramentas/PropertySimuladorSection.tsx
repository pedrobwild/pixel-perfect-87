import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowUpRight, FileText, Copy, Check, MapPin, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import SectionBlock from "@/components/guide/SectionBlock";
import { fmt } from "@/data/guide-data";

// Property-specific data for Urban Flex Bela Cintra
const PROPERTY = {
  name: "LM Urban Flex Bela Cintra",
  neighborhood: "Consolação / Bela Vista",
  address: "R. Bela Cintra, 209",
  dailyMin: 250,
  dailyMax: 420,
  avgOccupancy: 78,
  typologies: [
    { label: "Studio 18 m²", area: 18, dailyEstimate: 250 },
    { label: "Studio 27 m²", area: 27, dailyEstimate: 320 },
    { label: "Studio 36 m²", area: 36, dailyEstimate: 380 },
    { label: "Studio 83 m²", area: 83, dailyEstimate: 520 },
  ],
};

export default function PropertySimuladorSection() {
  const [selectedTypo, setSelectedTypo] = useState(1); // 27m² default
  const [simOcupacao, setSimOcupacao] = useState([PROPERTY.avgOccupancy]);
  const [simDiariaAtual, setSimDiariaAtual] = useState("");
  const [rateBoost, setRateBoost] = useState(0);
  const [simReformaBudget, setSimReformaBudget] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const typo = PROPERTY.typologies[selectedTypo];
  const baseDaily = simDiariaAtual ? Number(simDiariaAtual) : typo.dailyEstimate;

  const sim = useMemo(() => {
    const boostedDaily = baseDaily * (1 + rateBoost / 100);
    const nights = 30 * (simOcupacao[0] / 100);
    const receitaMensal = Math.round(boostedDaily * nights);
    const receitaAnual = receitaMensal * 12;
    const baseMensal = Math.round(baseDaily * nights);
    const delta = Math.round(boostedDaily * nights) - baseMensal;
    const budget = Number(simReformaBudget) || 0;
    const paybackMonths = delta > 0 && budget > 0 ? Math.ceil(budget / delta) : null;
    return { baseDaily: Math.round(baseDaily), boostedDaily: Math.round(boostedDaily), receitaMensal, receitaAnual, baseMensal, delta, paybackMonths };
  }, [baseDaily, simOcupacao, rateBoost, simReformaBudget]);

  const summaryText = useMemo(() => {
    return `📊 Simulação de Receita — ${PROPERTY.name}\n\nEndereço: ${PROPERTY.address}\nTipologia: ${typo.label}\nOcupação: ${simOcupacao[0]}%\nDiária base: R$ ${fmt(sim.baseDaily)}\n` +
      (rateBoost > 0 ? `Diária c/ boost +${rateBoost}%: R$ ${fmt(sim.boostedDaily)}\n` : "") +
      `\nReceita mensal: R$ ${fmt(sim.receitaMensal)}\nReceita anual: R$ ${fmt(sim.receitaAnual)}\n` +
      (sim.paybackMonths ? `\nPayback da reforma: ~${sim.paybackMonths} meses\n` : "") +
      `\nSimulação gerada para fins de estudo. Valores estimados.`;
  }, [typo, simOcupacao, sim, rateBoost]);

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    trackGlobal("export_simulation", { property: PROPERTY.name, tipologia: typo.label, resultado: sim.receitaMensal });
    setTimeout(() => setCopied(false), 2000);
  };

  const simTracked = useRef(false);
  useEffect(() => {
    if (simTracked.current) return;
    const t = setTimeout(() => {
      if (simDiariaAtual || rateBoost > 0 || simReformaBudget) {
        trackGlobal("simulator_used", { property: PROPERTY.name, tipologia: typo.label, ocupacao: simOcupacao[0], resultado: sim.receitaMensal });
        simTracked.current = true;
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [sim.receitaMensal]);

  return (
    <SectionBlock
      id="simulador"
      title="Simulador de Receita"
      takeaway={`Calcule a rentabilidade estimada do ${PROPERTY.name} com base na tipologia escolhida.`}
    >
      {/* Property badge */}
      <div className="flex items-center gap-2 mb-5 bg-primary/5 rounded-lg px-4 py-2.5">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-foreground font-medium">{PROPERTY.name}</span>
        <span className="text-xs text-muted-foreground">· {PROPERTY.address}</span>
      </div>

      <Card className="border-border">
        <CardContent className="p-6 space-y-5 font-body">
          {/* Typology selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Tipologia</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROPERTY.typologies.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => { setSelectedTypo(i); setSimDiariaAtual(""); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedTypo === i
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <Building2 className={`h-4 w-4 mb-1 ${selectedTypo === i ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">~R$ {fmt(t.dailyEstimate)}/noite</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Ocupação estimada: <span className="font-bold text-primary">{simOcupacao[0]}%</span>
            </label>
            <Slider value={simOcupacao} onValueChange={setSimOcupacao} min={50} max={95} step={1} />
            <p className="text-xs text-muted-foreground mt-1">Média da região: {PROPERTY.avgOccupancy}%</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Diária personalizada (R$)</label>
              <Input
                type="number"
                placeholder={`Estimativa: R$ ${fmt(typo.dailyEstimate)}`}
                value={simDiariaAtual}
                onChange={(e) => setSimDiariaAtual(e.target.value)}
                className="min-h-[48px] text-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Orçamento de reforma (R$)</label>
              <Input
                type="number"
                placeholder="Ex: 45.000"
                value={simReformaBudget}
                onChange={(e) => setSimReformaBudget(e.target.value)}
                className="min-h-[48px] text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Impacto de valorização na diária</label>
            <div className="flex gap-2 flex-wrap">
              {[0, 10, 20, 30].map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={rateBoost === v ? "default" : "outline"}
                  onClick={() => setRateBoost(v)}
                  className={`min-h-[44px] min-w-[48px] ${rateBoost === v ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {v === 0 ? "Base" : `+${v}%`}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Results */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.boostedDaily)}</p>
              <p className="text-xs text-muted-foreground">Diária {rateBoost > 0 ? `(+${rateBoost}%)` : "base"}</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaMensal)}</p>
              <p className="text-xs text-muted-foreground">Receita / mês</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">R$ {fmt(sim.receitaAnual)}</p>
              <p className="text-xs text-muted-foreground">Receita / ano</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-primary">{sim.paybackMonths ? `${sim.paybackMonths} meses` : "—"}</p>
              <p className="text-xs text-muted-foreground">Payback reforma</p>
            </div>
          </div>

          {rateBoost > 0 && sim.delta > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <ArrowUpRight className="text-primary mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-muted-foreground">
                Com +{rateBoost}% na diária, o {typo.label} gera <span className="font-bold text-foreground">R$ {fmt(sim.delta)}/mês</span> a mais em relação ao cenário base.
              </p>
            </div>
          )}

          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full min-h-[44px]">
                <FileText size={16} className="mr-2" /> Exportar simulação
              </Button>
            </DialogTrigger>
            <DialogContent className="font-body">
              <DialogHeader><DialogTitle className="font-display">Resumo da Simulação</DialogTitle></DialogHeader>
              <pre className="bg-muted rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-80 overflow-y-auto">{summaryText}</pre>
              <Button onClick={handleCopy} className="w-full bg-primary text-primary-foreground">
                {copied ? <><Check size={16} className="mr-2" /> Copiado!</> : <><Copy size={16} className="mr-2" /> Copiar texto</>}
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="mt-4 font-body">
        <AccordionItem value="rateboost">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Como funciona o boost na diária</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Base</strong> = diária estimada para a tipologia sem upgrades. <strong className="text-foreground">+10%</strong> = decoração básica melhorada. <strong className="text-foreground">+20%</strong> = decoração premium com fotos profissionais. <strong className="text-foreground">+30%</strong> = design autoral e operação otimizada. Os amenidades do {PROPERTY.name} (coworking, lavanderia, rooftop) já contribuem para diárias acima da média da região.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="location">
          <AccordionTrigger className="text-primary font-semibold min-h-[48px]">Por que a localização impacta a receita</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O empreendimento fica a 200 m da Av. Paulista, com acesso a 2 estações de metrô (Consolação e Paulista), hospitais de referência (Sírio-Libanês, Samaritano), centros corporativos e polos gastronômicos. Essa concentração de demanda sustenta ocupação alta e justifica diárias premium — o público-alvo inclui executivos em viagem, profissionais de saúde e turistas de experiência urbana.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SectionBlock>
  );
}
