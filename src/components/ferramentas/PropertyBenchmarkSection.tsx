import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, Building2, Landmark, BarChart3, ArrowUpRight } from "lucide-react";
import SectionBlock from "@/components/guide/SectionBlock";
import { PROPERTY, TYPOLOGIES, calcFinancials } from "@/data/propertyData";
import { fmt } from "@/data/guide-data";

const BENCHMARKS = [
  {
    id: "selic",
    label: "Selic (Tesouro)",
    yieldAnnual: 14.75, // Copom 18/mar/2026
    icon: Landmark,
    description: "Taxa básica de juros — corte para 14,75% em mar/2026",
    color: "bg-emerald-500",
  },
  {
    id: "cdi",
    label: "CDB 100% CDI",
    yieldAnnual: 14.65, // CDI acompanha Selic
    icon: Landmark,
    description: "Aplicação bancária atrelada ao CDI",
    color: "bg-emerald-400",
  },
  {
    id: "fii",
    label: "FIIs (média IFIX)",
    yieldAnnual: 11.2, // DY médio IFIX mar/2026
    icon: Building2,
    description: "Dividend yield médio 12 meses dos FIIs listados",
    color: "bg-sky-500",
  },
  {
    id: "poupanca",
    label: "Poupança",
    yieldAnnual: 7.6, // 0,5% + TR com Selic > 8,5%
    icon: Landmark,
    description: "Rendimento da caderneta com Selic acima de 8,5%",
    color: "bg-muted-foreground/60",
  },
];

export default function PropertyBenchmarkSection() {
  const typologyYields = useMemo(() => {
    return TYPOLOGIES.map((t) => {
      const fin = calcFinancials(t, PROPERTY.avgOccupancy);
      return { ...t, grossYield: fin.grossYield, netYield: fin.netYieldEstimate };
    });
  }, []);

  const allItems = useMemo(() => {
    const items = [
      ...typologyYields.map((t) => ({
        id: t.id,
        label: t.label,
        grossYield: t.grossYield,
        netYield: t.netYield,
        isProperty: true,
        description: `${t.area} m² · R$ ${fmt(t.purchasePrice)}`,
        color: "bg-primary",
      })),
      ...BENCHMARKS.map((b) => ({
        id: b.id,
        label: b.label,
        grossYield: b.yieldAnnual,
        netYield: b.id === "poupanca" ? b.yieldAnnual : b.yieldAnnual * 0.85, // IR 15% on fixed income
        isProperty: false,
        description: b.description,
        color: b.color,
      })),
    ];
    return items.sort((a, b) => b.netYield - a.netYield);
  }, [typologyYields]);

  const maxYield = Math.max(...allItems.map((i) => i.netYield));

  return (
    <SectionBlock
      id="benchmark"
      title="Comparativo com Outros Investimentos"
      takeaway="Yield líquido estimado do empreendimento vs. renda fixa e fundos imobiliários."
    >
      <p className="text-sm text-muted-foreground font-body mb-6">
        Comparação do <strong className="text-foreground">yield líquido estimado</strong> (descontando custos operacionais ou IR) de cada tipologia do {PROPERTY.name} com as principais alternativas de investimento do mercado.
      </p>

      {/* Bar chart */}
      <Card className="border-border mb-6">
        <CardContent className="p-6 space-y-3">
          {allItems.map((item, i) => {
            const barWidth = Math.max((item.netYield / maxYield) * 100, 4);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-28 sm:w-36 shrink-0 text-right">
                  <p className={`text-xs font-medium truncate ${item.isProperty ? "text-primary font-bold" : "text-foreground"}`}>
                    {item.label}
                  </p>
                </div>
                <div className="flex-1 h-8 bg-muted/40 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${barWidth}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-lg ${item.isProperty ? "bg-primary" : item.color} flex items-center justify-end pr-2`}
                  >
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">
                      {item.netYield.toFixed(1)}%
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {typologyYields.map((t, i) => {
          const advantage = t.netYield - BENCHMARKS[0].yieldAnnual * 0.85; // vs Selic net
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-display font-bold text-foreground text-sm">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground">{t.area} m² · R$ {fmt(t.purchasePrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-primary text-lg">{t.netYield.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground">líquido est.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className={`font-body text-[10px] ${advantage > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {advantage > 0 ? "+" : ""}{advantage.toFixed(1)}% vs Selic líq.
                    </Badge>
                    <span className="text-muted-foreground">Bruto: {t.grossYield}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Insight */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <BarChart3 className="text-primary mt-0.5 shrink-0" size={18} />
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong className="text-foreground">Por que comparar?</strong> A renda fixa paga juros sobre o capital, mas o imóvel para short stay combina <strong className="text-foreground">renda recorrente + valorização patrimonial</strong>. Em cenários de queda da Selic, o yield do imóvel se mantém enquanto a renda fixa diminui.
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Selic 14,75% e CDI: mar/2026 (Copom) · IFIX: DY 12 meses · Poupança: regra Selic &gt; 8,5%. Yield do imóvel: estimativa com {PROPERTY.avgOccupancy}% ocupação, descontando ~25% de custos operacionais.
          </p>
        </div>
      </div>
    </SectionBlock>
  );
}
