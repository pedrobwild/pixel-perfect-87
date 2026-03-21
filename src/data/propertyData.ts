// Central financial data for LM Urban Flex Bela Cintra
// All investment logic derives from this single source of truth.
//
// FONTE DE DADOS (médias de mercado, região Consolação / Bela Vista, São Paulo):
// • Preço de aquisição: ~R$ 11.000/m² para studios novos (Proprietário Direto, Loft, 2025)
// • Diárias: pesquisa Bwild 2025 — Consolação R$ 280–380, Bela Vista R$ 260–360
//   Ajustadas por metragem: studios menores têm diária/m² mais alta, maiores diluem.
// • Ocupação média: 78% (média plataformas short stay região central SP)

export const PROPERTY = {
  name: "LM Urban Flex Bela Cintra",
  neighborhood: "Consolação / Bela Vista",
  address: "R. Bela Cintra, 209",
  city: "São Paulo",
  avgOccupancy: 78,
  obraProgress: "63,53%",
  deliveryEstimate: "Dez/2026",
  amenities: ["Coworking", "Lavanderia", "Rooftop", "Academia", "Bike sharing"],
  avgPricePerSqm: 11_000,
  dailyRateSource: "Pesquisa Bwild 2025 · Média Consolação/Bela Vista",
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
    purchasePrice: 198_000,
    dailyEstimate: 220,
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
    purchasePrice: 297_000,
    dailyEstimate: 290,
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
    purchasePrice: 396_000,
    dailyEstimate: 340,
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
    purchasePrice: 913_000,
    dailyEstimate: 480,
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

  const totalInvestment = typo.purchasePrice;
  const grossYield = (annualRevenue / totalInvestment) * 100;
  const netYieldEstimate = grossYield * 0.75; // ~25% custos operacionais
  const paybackYears = totalInvestment / annualRevenue;
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
  if (lower.includes("conserv")) return TYPOLOGIES[3];
  if (lower.includes("arrojado") || lower.includes("agressivo")) return TYPOLOGIES[0];
  return TYPOLOGIES[1];
}
