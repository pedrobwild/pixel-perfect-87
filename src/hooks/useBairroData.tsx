import { createContext, useContext, useMemo } from "react";
import { BAIRRO_DATA, type BairroItem } from "@/data/guide-data";

type BairroContextValue = {
  bairros: BairroItem[];
  lastUpdated: string | null;
  isLoading: boolean;
};

const BairroContext = createContext<BairroContextValue>({
  bairros: BAIRRO_DATA as unknown as BairroItem[],
  lastUpdated: null,
  isLoading: false,
});

export function useBairroData() {
  return useContext(BairroContext);
}

export function BairroProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<BairroContextValue>(() => ({
    bairros: BAIRRO_DATA as unknown as BairroItem[],
    lastUpdated: "2026-03-01",
    isLoading: false,
  }), []);

  return <BairroContext.Provider value={value}>{children}</BairroContext.Provider>;
}
