/**
 * Teste de integração: garante que o yield bruto de Vila Mariana
 * é idêntico entre a tabela de inteligência (useIntelligenceData mock)
 * e o mapa/ranking (districtMetrics), mesmo após simular mudanças de inputs.
 */
import { describe, it, expect } from "vitest";
import { districtByName } from "@/data/districtMetrics";
import {
  annualRevenue,
  grossYield,
  grossYieldFromRevenue,
  investmentValue,
} from "@/lib/yieldCalc";

// Reproduz o registro de Vila Mariana do mock de useIntelligenceData.
// Mantemos uma cópia local pra evitar bater no react-query nesses testes.
const INTEL_VILA_MARIANA = {
  adr: 366,
  occupancy: 0.8,
  areaM2: 28,
  priceSqm: 11500,
  yield_bruto_airbnb: 0.332,
  receita_anual_media_studio: 106904,
};

const TOLERANCE = 0.005; // 0,5 p.p.

const yieldFromDistrict = (d: {
  revenueMonthBRL: number;
  priceSqm: number;
}, areaM2: number) =>
  grossYieldFromRevenue(d.revenueMonthBRL * 12, investmentValue(areaM2, d.priceSqm));

describe("Integração Vila Mariana — tabela × mapa/ranking", () => {
  const district = districtByName.get("Vila Mariana");

  it("Vila Mariana existe no districtMetrics", () => {
    expect(district).toBeDefined();
  });

  it("baseline: yields coincidem entre as duas fontes (~33,2%)", () => {
    const yIntel = grossYield(INTEL_VILA_MARIANA);
    const yMap = district!.roiPercent / 100;
    const yMapDerived = yieldFromDistrict(district!, INTEL_VILA_MARIANA.areaM2);

    expect(yIntel).toBeCloseTo(0.332, 2);
    expect(yMap).toBeCloseTo(0.332, 2);
    expect(Math.abs(yIntel - yMap)).toBeLessThan(TOLERANCE);
    expect(Math.abs(yIntel - yMapDerived)).toBeLessThan(TOLERANCE);
  });

  it("ADR/nightly sincronizados: intel.adr === district.nightlyRateBRL", () => {
    expect(district!.nightlyRateBRL).toBe(INTEL_VILA_MARIANA.adr);
  });

  it("ocupação sincronizada: intel.occupancy*100 === district.occupancyPercent", () => {
    expect(district!.occupancyPercent).toBe(INTEL_VILA_MARIANA.occupancy * 100);
  });

  it("preço/m² sincronizado entre tabela e mapa", () => {
    expect(district!.priceSqm).toBe(INTEL_VILA_MARIANA.priceSqm);
  });

  it("receita mensal do mapa ≈ receita anual da tabela / 12", () => {
    const diff = Math.abs(district!.revenueMonthBRL * 12 - INTEL_VILA_MARIANA.receita_anual_media_studio);
    // aceita <1% de diferença por arredondamento mensal
    expect(diff / INTEL_VILA_MARIANA.receita_anual_media_studio).toBeLessThan(0.01);
  });

  describe("mudanças de inputs mantêm consistência entre as fontes", () => {
    const scenarios = [
      { name: "ADR sobe para R$ 400", patch: { adr: 400, nightlyRateBRL: 400 } },
      { name: "ADR cai para R$ 300", patch: { adr: 300, nightlyRateBRL: 300 } },
      { name: "ocupação sobe para 90%", patch: { occupancy: 0.9, occupancyPercent: 90 } },
      { name: "ocupação cai para 65%", patch: { occupancy: 0.65, occupancyPercent: 65 } },
      { name: "preço/m² sobe para R$ 15.000", patch: { priceSqm: 15000 } },
      { name: "área sobe para 32 m²", patch: { areaM2: 32 } },
    ];

    for (const { name, patch } of scenarios) {
      it(name, () => {
        const intel = { ...INTEL_VILA_MARIANA, ...patch } as typeof INTEL_VILA_MARIANA;
        const nightly = (patch as any).nightlyRateBRL ?? intel.adr;
        const occPct = (patch as any).occupancyPercent ?? intel.occupancy * 100;
        const priceSqm = intel.priceSqm;
        const areaM2 = intel.areaM2;

        // Recalcula ambos lados a partir dos mesmos inputs
        const yIntel = grossYield(intel);

        const revenueMonth = annualRevenue(nightly, occPct / 100) / 12;
        const districtPatched = {
          revenueMonthBRL: revenueMonth,
          priceSqm,
        };
        const yMap = yieldFromDistrict(districtPatched, areaM2);

        expect(Math.abs(yIntel - yMap)).toBeLessThan(TOLERANCE);
      });
    }
  });
});
