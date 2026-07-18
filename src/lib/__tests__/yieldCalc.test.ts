import { describe, it, expect } from "vitest";
import {
  annualRevenue,
  investmentValue,
  grossYield,
  grossYieldFromRevenue,
} from "@/lib/yieldCalc";

// Baseline oficial de Vila Mariana (fonte: useIntelligenceData + districtMetrics)
const VILA_MARIANA = {
  adr: 366,
  occupancy: 0.8,
  areaM2: 28,
  priceSqm: 11500,
  revenueYearExpected: 106904, // valor fixado nos mocks
  investmentExpected: 322000,
  yieldExpected: 0.332,
};

describe("yieldCalc — Vila Mariana baseline", () => {
  it("investimento = área × preço/m² = R$ 322.000", () => {
    expect(investmentValue(VILA_MARIANA.areaM2, VILA_MARIANA.priceSqm)).toBe(
      VILA_MARIANA.investmentExpected,
    );
  });

  it("receita anual ≈ ADR × 365 × ocupação (~R$ 106.872)", () => {
    const revenue = annualRevenue(VILA_MARIANA.adr, VILA_MARIANA.occupancy);
    expect(revenue).toBeCloseTo(106872, 0);
    // aderente ao valor fixado no mock (diferença < 0,1%)
    expect(
      Math.abs(revenue - VILA_MARIANA.revenueYearExpected) /
        VILA_MARIANA.revenueYearExpected,
    ).toBeLessThan(0.001);
  });

  it("yield bruto ≈ 33,2%", () => {
    expect(grossYield(VILA_MARIANA)).toBeCloseTo(VILA_MARIANA.yieldExpected, 3);
  });

  it("yield a partir da receita fixada bate com 33,2%", () => {
    expect(
      grossYieldFromRevenue(
        VILA_MARIANA.revenueYearExpected,
        VILA_MARIANA.investmentExpected,
      ),
    ).toBeCloseTo(VILA_MARIANA.yieldExpected, 3);
  });
});

describe("yieldCalc — recálculo dinâmico", () => {
  it("aumentar ADR eleva o yield proporcionalmente", () => {
    const base = grossYield(VILA_MARIANA);
    const higher = grossYield({ ...VILA_MARIANA, adr: 400 });
    expect(higher).toBeGreaterThan(base);
    expect(higher / base).toBeCloseTo(400 / 366, 4);
  });

  it("reduzir ocupação diminui o yield proporcionalmente", () => {
    const base = grossYield(VILA_MARIANA);
    const lower = grossYield({ ...VILA_MARIANA, occupancy: 0.6 });
    expect(lower).toBeLessThan(base);
    expect(lower / base).toBeCloseTo(0.6 / 0.8, 4);
  });

  it("aumentar investimento (preço/m²) reduz o yield", () => {
    const base = grossYield(VILA_MARIANA);
    const lower = grossYield({ ...VILA_MARIANA, priceSqm: 15000 });
    expect(lower).toBeLessThan(base);
    expect(lower).toBeCloseTo(base * (11500 / 15000), 4);
  });

  it("aumentar área reduz o yield na mesma proporção", () => {
    const base = grossYield(VILA_MARIANA);
    const lower = grossYield({ ...VILA_MARIANA, areaM2: 35 });
    expect(lower).toBeCloseTo(base * (28 / 35), 4);
  });

  it("receita zero => yield zero", () => {
    expect(grossYield({ ...VILA_MARIANA, adr: 0 })).toBe(0);
    expect(grossYield({ ...VILA_MARIANA, occupancy: 0 })).toBe(0);
  });

  it("investimento zero não quebra (retorna 0)", () => {
    expect(grossYield({ ...VILA_MARIANA, areaM2: 0 })).toBe(0);
    expect(grossYieldFromRevenue(100000, 0)).toBe(0);
  });
});

describe("yieldCalc — consistência com mocks Vila Mariana", () => {
  it("mock districtMetrics roiPercent 33,2% bate com fórmula", async () => {
    const { districtByName } = await import("@/data/districtMetrics");
    const vm = districtByName.get("Vila Mariana");
    expect(vm).toBeDefined();
    expect(vm!.roiPercent).toBeCloseTo(33.2, 1);

    // revenueMonthBRL × 12 / investimento ≈ roiPercent/100
    const investment = VILA_MARIANA.investmentExpected;
    const yieldFromMock = (vm!.revenueMonthBRL * 12) / investment;
    expect(yieldFromMock).toBeCloseTo(0.332, 2);
  });
});
