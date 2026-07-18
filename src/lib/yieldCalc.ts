/**
 * Yield bruto Airbnb = receita anual / investimento
 *
 * receita anual = ADR × 365 × ocupação
 * investimento   = área (m²) × preço/m²
 */

export type YieldInputs = {
  adr: number;
  occupancy: number; // 0..1
  areaM2: number;
  priceSqm: number;
};

export const annualRevenue = (adr: number, occupancy: number, days = 365) =>
  adr * days * occupancy;

export const investmentValue = (areaM2: number, priceSqm: number) =>
  areaM2 * priceSqm;

export const grossYield = ({ adr, occupancy, areaM2, priceSqm }: YieldInputs) => {
  const investment = investmentValue(areaM2, priceSqm);
  if (investment <= 0) return 0;
  return annualRevenue(adr, occupancy) / investment;
};

export const grossYieldFromRevenue = (revenueYear: number, investment: number) =>
  investment > 0 ? revenueYear / investment : 0;
