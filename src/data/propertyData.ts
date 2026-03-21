// Central financial data for LM Urban Flex Bela Cintra
// All investment logic derives from this single source of truth.
//
// FONTE DE DADOS (médias de mercado, região Consolação / Bela Vista, São Paulo):
// • Preço de aquisição: ~R$ 11.000/m² para studios novos (Proprietário Direto, Loft, 2025)
// • Diárias: pesquisa Bwild 2025 — Consolação R$ 280–380, Bela Vista R$ 260–360
//   Ajustadas por metragem: studios menores têm diária/m² mais alta, maiores diluem.
// • Ocupação média: 78% (média plataformas short stay região central SP)
// • Setup/decoração: R$ 1.200–1.400/m² (estimativa Bwild para projetos de Airbnb)

export const PROPERTY = {
  name: "LM Urban Flex Bela Cintra",
  neighborhood: "Consolação / Bela Vista",
  address: "R. Bela Cintra, 209",
  city: "São Paulo",
  avgOccupancy: 78,
  obraProgress: "63,53%",
  deliveryEstimate: "Dez/2026",
  amenities: ["Coworking", "Lavanderia", "Rooftop", "Academia", "Bike sharing"],
  /** Preço médio do m² na região para studios novos */
  avgPricePerSqm: 11_000,
  /** Fonte dos dados de diária */
  dailyRateSource: "Pesquisa Bwild 2025 · Média Consolação/Bela Vista",
  /** Fonte dos dados de preço */
  priceSource: "Proprietário Direto / Loft · Média região 2025",
} as const;

export interface Typology {
  id: string;
  label: string;
  area: number;
  /** Preço médio de mercado para a metragem (R$) */
  purchasePrice: number;
  /** Diária média de mercado para a metragem (R$) */
  dailyEstimate: number;
  /** Custo estimado de setup/decoração (R$) */
  setupCost: number;
  /** Perfil ideal */
  idealProfile: "conservador" | "equilibrado" | "arrojado";
  /** Destaques curtos */
  highlights: string[];
}

export const TYPOLOGIES: Typology[] = [
  {
    id: "18m2",
    label: "Studio 18 m²",
    area: 18,
    // 18 × R$ 11.000 = R$ 198.000 (arredondado)
    purchasePrice: 198_000,
    // Studios compactos na Consolação: média ~R$ 220/noite (faixa inferior por metragem reduzida)
    dailyEstimate: 220,
    // 18 × R$ 1.400/m² ≈ R$ 25.000
    setupCost: 25_000,
    idealProfile: "arrojado",
    highlights: [
      "Menor ticket de entrada da região",
      "Maior yield bruto por m²",
      "Alta rotatividade — ideal para 1–2 noites",
    ],
  },
  {
    id: "27m2",
    label: "Studio 27 m²",
    area: 27,
    // 27 × R$ 11.000 = R$ 297.000
    purchasePrice: 297_000,
    // Faixa central Consolação/Bela Vista: ~R$ 290/noite
    dailyEstimate: 290,
    // 27 × R$ 1.300/m² ≈ R$ 35.000
    setupCost: 35_000,
    idealProfile: "equilibrado",
    highlights: [
      "Melhor equilíbrio ticket × retorno",
      "Aceita casais e estadias corporativas",
      "Tipologia mais comum no mercado",
    ],
  },
  {
    id: "36m2",
    label: "Studio 36 m²",
    area: 36,
    // 36 × R$ 11.000 = R$ 396.000
    purchasePrice: 396_000,
    // Faixa superior Consolação: ~R$ 340/noite
    dailyEstimate: 340,
    // 36 × R$ 1.250/m² ≈ R$ 45.000
    setupCost: 45_000,
    idealProfile: "equilibrado",
    highlights: [
      "Diária premium com mais conforto",
      "Público corporativo e médico",
      "Estadias médias de 3–7 noites",
    ],
  },
  {
    id: "83m2",
    label: "Duplex 83 m²",
    area: 83,
    // 83 × R$ 11.000 = R$ 913.000
    purchasePrice: 913_000,
    // Unidades grandes na região: ~R$ 480/noite (Bela Vista/Consolação, faixa alta)
    dailyEstimate: 480,
    // 83 × R$ 1.200/m² ≈ R$ 100.000 (duplex tem custo maior de marcenaria)
    setupCost: 100_000,
    idealProfile: "conservador",
    highlights: [
      "Diária mais alta do empreendimento",
      "Público premium: famílias e grupos",
      "Menor vacância em alta temporada",
    ],
  },
];

/** Calcula métricas financeiras para uma tipologia */
export function calcFinancials(
  typo: Typology,
  occupancyPct: number = PROPERTY.avgOccupancy,
  rateBoostPct: number = 0,
) {
  const boostedDaily = typo.dailyEstimate * (1 + rateBoostPct / 100);
  const nightsPerMonth = 30 * (occupancyPct / 100);
  const monthlyRevenue = Math.round(boostedDaily * nightsPerMonth);
  const annualRevenue = monthlyRevenue * 12;

  const totalInvestment = typo.purchasePrice + typo.setupCost;
  const grossYield = (annualRevenue / totalInvestment) * 100;
  const netYieldEstimate = grossYield * 0.75; // ~25% custos operacionais
  const paybackYears = totalInvestment / annualRevenue;
  const setupPaybackMonths = typo.setupCost > 0 ? Math.ceil(typo.setupCost / monthlyRevenue) : 0;
  const pricePerSqm = Math.round(typo.purchasePrice / typo.area);

  return {
    boostedDaily: Math.round(boostedDaily),
    nightsPerMonth: Math.round(nightsPerMonth),
    monthlyRevenue,
    annualRevenue,
    totalInvestment,
    grossYield: Number(grossYield.toFixed(1)),
    netYieldEstimate: Number(netYieldEstimate.toFixed(1)),
    paybackYears: Number(paybackYears.toFixed(1)),
    setupPaybackMonths,
    pricePerSqm,
  };
}

/** Ordena tipologias por yield bruto */
export function rankByYield(occupancyPct: number = PROPERTY.avgOccupancy) {
  return TYPOLOGIES
    .map((t) => ({ ...t, ...calcFinancials(t, occupancyPct) }))
    .sort((a, b) => b.grossYield - a.grossYield);
}

/** Recomenda tipologia com base no perfil */
export function recommendTypology(profileName: string): Typology {
  const lower = profileName.toLowerCase();
  if (lower.includes("conserv")) return TYPOLOGIES[3]; // 83m² — menor risco
  if (lower.includes("arrojado") || lower.includes("agressivo")) return TYPOLOGIES[0]; // 18m² — maior yield
  return TYPOLOGIES[1]; // 27m² — equilibrado
}
