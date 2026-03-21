import AppNavbar from "@/components/AppNavbar";
import { BairroProvider } from "@/hooks/useBairroData";
import { GuideDecisionProvider } from "@/hooks/useGuideDecision";
import DiagnosticoInvestidorSection from "@/components/guide/DiagnosticoInvestidorSection";
import RecomendacaoSection from "@/components/guide/RecomendacaoSection";
import PlanoAcaoSection from "@/components/guide/PlanoAcaoSection";
import MarketIntelSection from "@/components/MarketIntelSection";
import SimuladorSection from "@/components/guide/SimuladorSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import bwildLogo from "@/assets/bwild-logo.png";
import { useEffect } from "react";

export default function Ferramentas() {
  useEffect(() => {
    document.title = "Ferramentas do Investidor · Urban Flex Bela Cintra · Bwild";
  }, []);

  return (
    <BairroProvider>
      <GuideDecisionProvider>
        <AppNavbar />
        <main className="w-full flex flex-col items-center pb-24 pt-16 lg:pt-8">
          {/* Header */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10 pt-8 pb-4">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Ferramentas do Investidor
              </h1>
              <p className="text-muted-foreground text-lg font-body max-w-2xl">
                Análise de mercado ao vivo, diagnóstico de perfil, simulador de retorno e plano de ação — tudo focado no Urban Flex Bela Cintra.
              </p>
            </div>
          </div>

          {/* Market Intel — Perplexity */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <MarketIntelSection />
            </div>
          </div>

          {/* Simulador */}
          <div className="w-full bg-muted/20">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <SimuladorSection />
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <DiagnosticoInvestidorSection />
            </div>
          </div>

          {/* Recomendação */}
          <div className="w-full bg-muted/20">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <RecomendacaoSection />
            </div>
          </div>

          {/* Plano de ação */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <PlanoAcaoSection />
            </div>
          </div>

          {/* CTA Urban Flex */}
          <div className="w-full bg-muted/20">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10 py-12 text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Pronto para explorar o empreendimento?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Veja todas as tipologias, simulador completo e detalhes do Urban Flex Bela Cintra.
              </p>
              <Link to="/urban-flex-bela-cintra">
                <Button size="lg" className="min-h-[48px]">
                  Ver Urban Flex Bela Cintra
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="max-w-[1280px] mx-auto px-5 lg:px-10">
              <footer className="text-center py-8 text-sm text-muted-foreground font-body">
                <img src={bwildLogo} alt="Bwild" className="h-6 w-auto mx-auto mb-3 opacity-60" />
                © 2026 Bwild · Ferramentas do Investidor
              </footer>
            </div>
          </div>
        </main>
      </GuideDecisionProvider>
    </BairroProvider>
  );
}
