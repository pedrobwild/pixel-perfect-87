// Central financial data for LM Urban Flex Bela Cintra
// All investment logic derives from this single source of truth.

export const PROPERTY = {
  name: "LM Urban Flex Bela Cintra",
  neighborhood: "Consolação / Bela Vista",
  address: "R. Bela Cintra, 209",
  city: "São Paulo",
  avgOccupancy: 78,
  obraProgress: "63,53%",
  deliveryEstimate: "Dez/2026",
  amenities: ["Coworking", "Lavanderia", "Rooftop", "Academia", "Bike sharing"],
} as const;

export interface Typology {
  id: string;
  label: string;
  area: number;
  /** Preço de tabela da unidade (R$) */
  purchasePrice: number;
  /** Diária estimada base (R$) */
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
    purchasePrice: 299_000,
    dailyEstimate: 250,
    setupCost: 25_000,
    idealProfile: "arrojado",
    highlights: [
      "Menor ticket de entrada",
      "Maior yield bruto do empreendimento",
      "Ideal para alta rotatividade",
    ],
  },
  {
    id: "27m2",
    label: "Studio 27 m²",
    area: 27,
    purchasePrice: 419_000,
    dailyEstimate: 320,
    setupCost: 35_000,
    idealProfile: "equilibrado",
    highlights: [
      "Melhor equilíbrio ticket × retorno",
      "Aceita casais e estadias corporativas",
      "Tipologia mais versátil",
    ],
  },
  {
    id: "36m2",
    label: "Studio 36 m²",
    area: 36,
    purchasePrice: 529_000,
    dailyEstimate: 380,
    setupCost: 45_000,
    idealProfile: "equilibrado",
    highlights: [
      "Diária premium com conforto extra",
      "Ideal para médicos e executivos",
      "Estadias médias mais longas",
    ],
  },
  {
    id: "83m2",
    label: "Duplex 83 m²",
    area: 83,
    purchasePrice: 989_000,
    dailyEstimate: 520,
    setupCost: 80_000,
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
