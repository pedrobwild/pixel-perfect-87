import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const UrbanFlexInvestorGuide = lazy(() => import("./pages/UrbanFlexInvestorGuide"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/urban-flex-bela-cintra" element={<UrbanFlexInvestorGuide />} />
            {/* <Route path="/guia-short-stay" element={<ShortStayGuide />} /> */}
            <Route path="/ferramentas" element={<Ferramentas />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
