import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Target, Calculator, Paintbrush, ShieldCheck, Phone,
  CheckCircle2, AlertCircle, ArrowRight, Rocket, Building2,
  FileSearch, TrendingUp,
} from "lucide-react";
import SectionBlock from "@/components/guide/SectionBlock";
import { useGuideDecision } from "@/hooks/useGuideDecision";

interface ActionStep {
  icon: any;
  title: string;
  description: string;
  status: "done" | "action" | "warning" | "pending";
  href?: string;
}

export default function PropertyPlanoAcaoSection() {
  const { investorProfile, hasProfile, unitScore, hasUnitScore } = useGuideDecision();

  const steps = useMemo((): ActionStep[] => {
    const result: ActionStep[] = [];

    result.push({
      icon: Target,
      title: "Definir seu perfil de investidor",
      description: hasProfile
        ? `Perfil definido: ${investorProfile!.name}. Análise personalizada ativa.`
        : "Complete o diagnóstico para personalizar a análise do empreendimento.",
      status: hasProfile ? "done" : "action",
      href: "#diagnostico",
    });

    result.push({
      icon: TrendingUp,
      title: "Analisar dados de mercado ao vivo",
      description: "Consulte o comparativo de mercado com dados atualizados da região do empreendimento.",
      status: hasProfile ? "action" : "pending",
      href: "#market-intel",
    });

    result.push({
      icon: Building2,
      title: "Entender as vantagens do empreendimento",
      description: "Veja como a localização do Urban Flex Bela Cintra se posiciona frente a bairros concorrentes.",
      status: hasProfile ? "action" : "pending",
      href: "#recomendacao",
    });

    result.push({
      icon: Calculator,
      title: "Simular receita na tipologia ideal",
      description: "Rode o simulador com a tipologia que mais combina com seu perfil e veja a projeção de retorno.",
      status: "action",
      href: "#simulador",
    });

    result.push({
      icon: FileSearch,
      title: "Revisar o guia completo",
      description: "Aprofunde-se no Guia Short Stay com análise de reforma, decoração, precificação e operação.",
      status: "pending",
      href: "/guia-short-stay",
    });

    result.push({
      icon: Phone,
      title: "Falar com a equipe comercial",
      description: "Tire dúvidas restantes, negocie condições e reserve sua unidade no Urban Flex Bela Cintra.",
      status: "pending",
      href: "https://wa.me/5591984804821?text=Olá!%20Quero%20saber%20mais%20sobre%20o%20Urban%20Flex%20Bela%20Cintra.",
    });

    return result;
  }, [hasProfile, investorProfile, hasUnitScore, unitScore]);

  const completedCount = steps.filter(s => s.status === "done").length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <SectionBlock
      id="plano-acao"
      title="Seu Plano de Ação"
      takeaway="Com base no que você preencheu, estes são seus próximos passos para investir no Urban Flex."
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs font-body text-muted-foreground">
          {completedCount}/{steps.length} etapas
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const cfg = {
            done: { badge: "Concluído", badgeClass: "bg-primary/10 text-primary", iconClass: "text-primary bg-primary/10", dot: <CheckCircle2 size={14} className="text-primary" /> },
            action: { badge: "Próximo passo", badgeClass: "bg-amber-100 text-amber-800", iconClass: "text-amber-600 bg-amber-50", dot: <ArrowRight size={14} className="text-amber-600" /> },
            warning: { badge: "Atenção", badgeClass: "bg-destructive/10 text-destructive", iconClass: "text-destructive bg-destructive/5", dot: <AlertCircle size={14} className="text-destructive" /> },
            pending: { badge: "Pendente", badgeClass: "bg-muted text-muted-foreground", iconClass: "text-muted-foreground bg-muted", dot: <span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> },
          }[step.status];

          const isExternal = step.href?.startsWith("http");

          return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              {isExternal ? (
                <a href={step.href} target="_blank" rel="noopener noreferrer" className="block">
                  <StepCard Icon={Icon} step={step} cfg={cfg} />
                </a>
              ) : step.href?.startsWith("/") ? (
                <a href={step.href} className="block">
                  <StepCard Icon={Icon} step={step} cfg={cfg} />
                </a>
              ) : (
                <a href={step.href} className="block">
                  <StepCard Icon={Icon} step={step} cfg={cfg} />
                </a>
              )}
            </motion.div>
          );
        })}
      </div>

      {hasProfile && (
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-3">
          <Rocket className="text-primary mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-display font-bold text-foreground text-sm mb-1">
              {completedCount >= 2 ? "Você está no caminho certo" : "Bom começo — continue explorando"}
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {completedCount >= 2
                ? "Simule a receita na tipologia ideal e fale com a equipe para condições especiais."
                : "Explore o comparativo de mercado e o simulador para entender o potencial do empreendimento."
              }
            </p>
          </div>
        </div>
      )}
    </SectionBlock>
  );
}

function StepCard({ Icon, step, cfg }: { Icon: any; step: ActionStep; cfg: any }) {
  return (
    <Card className={`border-border transition-all hover:shadow-md ${
      step.status === "action" ? "border-amber-300/50" : ""
    }`}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconClass}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-display font-bold text-foreground text-sm">{step.title}</p>
            <Badge className={`${cfg.badgeClass} font-body text-[10px]`}>{cfg.badge}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">{step.description}</p>
        </div>
        <div className="shrink-0 mt-1">{cfg.dot}</div>
      </CardContent>
    </Card>
  );
}
