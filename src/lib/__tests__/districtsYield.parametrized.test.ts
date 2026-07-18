/**
 * Testes parametrizados: valida yield bruto de todos os distritos do
 * dataset mock (useIntelligenceData) e garante que mutações em
 * ADR, ocupação, área e preço/m² recalculam corretamente cada um.
 */
import { describe, it, expect } from "vitest";
import {
  annualRevenue,
  grossYield,
  investmentValue,
} from "@/lib/yieldCalc";

// Espelho do mock de useIntelligenceData (10 bairros).
// Copiado localmente para não instanciar react-query nos testes.
type IntelDistrict = {
  bairro: string;
  adr: number;
  occupancy: number;
  areaM2: number;
  priceSqm: number;
  yieldReported: number;
  revenueYearReported: number;
};

const INTEL_DISTRICTS: IntelDistrict[] = [
  { bairro: "Vila Mariana",  adr: 366, occupancy: 0.80, areaM2: 28, priceSqm: 11500, yieldReported: 0.332, revenueYearReported: 106904 },
  { bairro: "Pinheiros",     adr: 350, occupancy: 0.82, areaM2: 30, priceSqm: 14000, yieldReported: 0.137, revenueYearReported: 104790 },
  { bairro: "Consolação",    adr: 260, occupancy: 0.76, areaM2: 26, priceSqm: 10500, yieldReported: 0.118, revenueYearReported: 72124 },
  { bairro: "Bela Vista",    adr: 240, occupancy: 0.74, areaM2: 25, priceSqm:  9800, yieldReported: 0.112, revenueYearReported: 64896 },
  { bairro: "Itaim Bibi",    adr: 380, occupancy: 0.78, areaM2: 32, priceSqm: 16000, yieldReported: 0.142, revenueYearReported: 108186 },
  { bairro: "Moema",         adr: 300, occupancy: 0.77, areaM2: 29, priceSqm: 13000, yieldReported: 0.125, revenueYearReported: 84315 },
  { bairro: "Brooklin",      adr: 290, occupancy: 0.75, areaM2: 27, priceSqm: 12000, yieldReported: 0.120, revenueYearReported: 79388 },
  { bairro: "República",     adr: 200, occupancy: 0.72, areaM2: 22, priceSqm:  7500, yieldReported: 0.105, revenueYearReported: 52560 },
  { bairro: "Liberdade",     adr: 220, occupancy: 0.73, areaM2: 24, priceSqm:  8500, yieldReported: 0.115, revenueYearReported: 58619 },
  { bairro: "Vila Olímpia",  adr: 360, occupancy: 0.79, areaM2: 31, priceSqm: 15000, yieldReported: 0.135, revenueYearReported: 103806 },
];

// Tolerância: mocks arredondam ADR/receita, então 1,5 p.p. cobre o erro
// de arredondamento máximo observado (~1,2 p.p. em Vila Mariana).
const YIELD_TOL = 0.015;
const REVENUE_TOL_PCT = 0.005; // 0,5% entre ADR×365×occ e revenueYearReported

describe.each(INTEL_DISTRICTS)("yield bruto — $bairro", (d) => {
  const investment = investmentValue(d.areaM2, d.priceSqm);
  const revenueYear = annualRevenue(d.adr, d.occupancy);

  it("receita anual calculada bate com a receita reportada", () => {
    const diff = Math.abs(revenueYear - d.revenueYearReported) / d.revenueYearReported;
    expect(diff).toBeLessThan(REVENUE_TOL_PCT);
  });

  it("yield da fórmula bate com yield reportado no mock", () => {
    const y = grossYield(d);
    expect(Math.abs(y - d.yieldReported)).toBeLessThan(YIELD_TOL);
  });

  it("investimento = área × preço/m² > 0", () => {
    expect(investment).toBe(d.areaM2 * d.priceSqm);
    expect(investment).toBeGreaterThan(0);
  });

  describe("mutações recalculam proporcionalmente", () => {
    const base = grossYield(d);

    it("ADR +20% => yield +20%", () => {
      const y = grossYield({ ...d, adr: d.adr * 1.2 });
      expect(y / base).toBeCloseTo(1.2, 4);
    });

    it("ADR -30% => yield -30%", () => {
      const y = grossYield({ ...d, adr: d.adr * 0.7 });
      expect(y / base).toBeCloseTo(0.7, 4);
    });

    it("ocupação +10 p.p. escala linearmente", () => {
      const newOcc = Math.min(1, d.occupancy + 0.1);
      const y = grossYield({ ...d, occupancy: newOcc });
      expect(y / base).toBeCloseTo(newOcc / d.occupancy, 4);
    });

    it("preço/m² +50% => yield / 1,5", () => {
      const y = grossYield({ ...d, priceSqm: d.priceSqm * 1.5 });
      expect(y / base).toBeCloseTo(1 / 1.5, 4);
    });

    it("área +25% => yield / 1,25", () => {
      const y = grossYield({ ...d, areaM2: d.areaM2 * 1.25 });
      expect(y / base).toBeCloseTo(1 / 1.25, 4);
    });

    it("ADR = 0 => yield = 0", () => {
      expect(grossYield({ ...d, adr: 0 })).toBe(0);
    });

    it("ocupação = 0 => yield = 0", () => {
      expect(grossYield({ ...d, occupancy: 0 })).toBe(0);
    });
  });
});

describe("yield bruto — ranking geral", () => {
  it("todos os yields > 0", () => {
    for (const d of INTEL_DISTRICTS) {
      expect(grossYield(d)).toBeGreaterThan(0);
    }
  });

  it("Vila Mariana lidera o ranking de yield bruto", () => {
    const ranked = [...INTEL_DISTRICTS]
      .map((d) => ({ bairro: d.bairro, y: grossYield(d) }))
      .sort((a, b) => b.y - a.y);
    expect(ranked[0].bairro).toBe("Vila Mariana");
  });
});
