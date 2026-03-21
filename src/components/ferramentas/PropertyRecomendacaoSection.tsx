import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  MapPin, TrendingUp, Building2, Train, HeartPulse, Briefcase,
  CheckCircle2, Star, BarChart3, Users, Coffee,
} from "lucide-react";
import SectionBlock from "@/components/guide/SectionBlock";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { fmt } from "@/data/guide-data";

const PROPERTY_METRICS = {
  name: "LM Urban Flex Bela Cintra",
  address: "R. Bela Cintra, 209 — Consolação / Bela Vista",
  dailyRange: "R$ 250 – R$ 520",
  avgOccupancy: "78%",
  yieldEstimate: "6,5% – 9,2%",
  obraProgress: "63,53%",
};

const LOCATION_ADVANTAGES = [
  { icon: MapPin, text: "200 m da Av. Paulista — endereço com demanda premium constante" },
  { icon: Train, text: "2 estações de metrô a 5 min (Consolação + Paulista)" },
  { icon: HeartPulse, text: "Próximo a hospitais de referência: Sírio-Libanês, Samaritano, Santa Catarina" },
  { icon: Briefcase, text: "Polo corporativo: Faria Lima, Paulista e Itaim a menos de 15 min" },
  { icon: Coffee, text: "Gastronomia e vida noturna: R. Augusta, R. Oscar Freire, Vila Madalena" },
  { icon: Users, text: "Público diversificado: executivos, médicos, turistas e nômades digitais" },
];

const COMPARISON = [
  { bairro: "Consolação (Urban Flex)", dailyAvg: 320, occupancy: 78, yield: "7,8%", highlight: true },
  { bairro: "Pinheiros", dailyAvg: 380, occupancy: 82, yield: "6,2%", highlight: false },
  { bairro: "Vila Mariana", dailyAvg: 280, occupancy: 80, yield: "7,1%", highlight: false },
  { bairro: "Itaim Bibi", dailyAvg: 420, occupancy: 78, yield: "5,8%", highlight: false },
  { bairro: "República", dailyAvg: 200, occupancy: 72, yield: "8,5%", highlight: false },
];

export default function PropertyRecomendacaoSection() {
  const { investorProfile, hasProfile } = useGuideDecision();

  return (
    <SectionBlock
      id="recomendacao"
      title="Por que investir aqui"
      takeaway="Veja como a localização do Urban Flex se posiciona frente ao mercado de short stay em São Paulo."
    >
      {/* Property card */}
      <Card className="border-2 border-primary/20 bg-primary/[0.02] mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold text-foreground mb-1">{PROPERTY_METRICS.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{PROPERTY_METRICS.address}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricBox label="Diária estimada" value={PROPERTY_METRICS.dailyRange} />
                <MetricBox label="Ocupação média" value={PROPERTY_METRICS.avgOccupancy} />
                <MetricBox label="Yield bruto est." value={PROPERTY_METRICS.yieldEstimate} />
                <MetricBox label="Obra concluída" value={PROPERTY_METRICS.obraProgress} />
              </div>
            </div>
          </div>

          {hasProfile && (
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
              <Badge className={`${investorProfile!.color} ${investorProfile!.textColor} font-body text-xs`}>
                {investorProfile!.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Seu perfil indica foco em {getProfileFocus(investorProfile!)} — o Urban Flex atende esse critério.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location advantages */}
      <h3 className="font-display text-lg font-bold text-foreground mb-4">Vantagens da localização</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {LOCATION_ADVANTAGES.map((adv, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-background hover:bg-muted/30 transition-colors">
              <adv.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{adv.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparative table */}
      <h3 className="font-display text-lg font-bold text-foreground mb-4">
        Comparativo com bairros concorrentes
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        A região do Urban Flex combina yield atrativo com ocupação estável — difícil de encontrar em bairros premium.
      </p>
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="bg-secondary">
                <tr>
                  {["Região", "Diária média", "Ocupação", "Yield bruto"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.bairro}
                    className={`border-t border-border ${row.highlight ? "bg-primary/5 font-medium" : "hover:bg-muted/50"} transition-colors`}
                  >
                    <td className="px-4 py-3 text-foreground flex items-center gap-2">
                      {row.highlight && <Star className="h-3.5 w-3.5 text-primary shrink-0" />}
                      {row.bairro}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">R$ {fmt(row.dailyAvg)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.occupancy}%</td>
                    <td className={`px-4 py-3 ${row.highlight ? "text-primary font-bold" : "text-muted-foreground"}`}>{row.yield}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <BarChart3 className="text-primary mt-0.5 shrink-0" size={18} />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Insight:</strong> Bairros como Itaim e Pinheiros têm diárias mais altas, mas yield menor — o custo de aquisição corrói a rentabilidade. A Consolação oferece o melhor equilíbrio entre diária competitiva e retorno sobre o investimento.
        </p>
      </div>
    </SectionBlock>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-center">
      <p className="text-sm font-display font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
    </div>
  );
}

function getProfileFocus(profile: any): string {
  const dominant = Object.entries(profile.weights as Record<string, number>)
    .sort((a, b) => b[1] - a[1])[0][0];
  const map: Record<string, string> = {
    retorno: "maximizar retorno",
    demanda: "alta liquidez e demanda",
    operacao: "operação previsível",
    futuro: "potencial de valorização",
  };
  return map[dominant] || "equilíbrio";
}
