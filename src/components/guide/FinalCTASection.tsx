import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowRight, Building2 } from "lucide-react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import SectionBlock from "./SectionBlock";

const WA_URL = "https://wa.me/5591984804821?text=Olá!%20Acabei%20de%20analisar%20o%20Urban%20Flex%20Bela%20Cintra%20e%20quero%20saber%20mais%20sobre%20condições%20e%20disponibilidade.";

export default function FinalCTASection() {
  return (
    <SectionBlock
      id="cta-final"
      title="Próximo Passo"
      takeaway="Você já analisou o mercado e simulou a receita — agora é hora de garantir sua unidade."
      className="[&_h2]:text-primary-foreground [&_>div>p:first-of-type]:text-primary-foreground/80"
    >
      <Card className="border-border/30 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-foreground mb-2">
              Fale com a equipe comercial
            </p>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Tire suas últimas dúvidas, negocie condições especiais e reserve a tipologia ideal no Urban Flex Bela Cintra.
            </p>
          </div>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGlobal("cta_clicked", { cta_id: "whatsapp_final", section: "cta_final" })}
          >
            <Button size="lg" className="min-h-[52px] text-base gap-2">
              <MessageCircle size={18} />
              Conversar no WhatsApp
              <ArrowRight size={16} />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground font-body">Atendimento direto · Sem compromisso</p>
        </CardContent>
      </Card>
    </SectionBlock>
  );
}
