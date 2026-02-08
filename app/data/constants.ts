import { RankTier, RankDivision, Position } from "../types/riot";

// ─── Rank Tier Order & LP Values ───
// Iron–Diamond: 4 divisions × 100 LP = 400 LP per tier
// Master → Grandmaster: 200 LP
// Grandmaster → Challenger: 300 LP

export const TIER_ORDER: RankTier[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

export const DIVISION_ORDER: RankDivision[] = ["IV", "III", "II", "I"];

// LP width of each tier (used for rankToLp and progress bar)
export const TIER_LP_WIDTH: Record<RankTier, number> = {
  IRON: 400,
  BRONZE: 400,
  SILVER: 400,
  GOLD: 400,
  PLATINUM: 400,
  EMERALD: 400,
  DIAMOND: 400,
  MASTER: 200,
  GRANDMASTER: 300,
  CHALLENGER: 500, // open-ended, but cap for display
};

// Base LP for each tier (computed from widths)
function computeTierBases(): Record<RankTier, number> {
  const bases = {} as Record<RankTier, number>;
  let cumulative = 0;
  for (const tier of TIER_ORDER) {
    bases[tier] = cumulative;
    cumulative += TIER_LP_WIDTH[tier];
  }
  return bases;
}
export const TIER_BASE_LP = computeTierBases();

export function rankToLp(
  tier: RankTier,
  division: RankDivision,
  lp: number,
): number {
  const tierIndex = TIER_ORDER.indexOf(tier);
  if (tierIndex === -1) return 0;

  let baseLp = TIER_BASE_LP[tier];

  // Iron–Diamond have 4 divisions
  if (tierIndex <= 6) {
    const divIndex = DIVISION_ORDER.indexOf(division);
    baseLp += divIndex * 100;
  }

  return baseLp + lp;
}

// Max LP for progress bar (Challenger base + buffer)
export const MAX_LP = TIER_BASE_LP.CHALLENGER + TIER_LP_WIDTH.CHALLENGER;

export function lpToProgress(totalLp: number): number {
  return Math.min((totalLp / MAX_LP) * 100, 100);
}

// Progress % where each tier starts (for proportional bar segments)
export function tierStartPercent(tier: RankTier): number {
  return (TIER_BASE_LP[tier] / MAX_LP) * 100;
}

export function tierWidthPercent(tier: RankTier): number {
  return (TIER_LP_WIDTH[tier] / MAX_LP) * 100;
}

// ─── Tier Colors (single source of truth) ───
// export const TIER_COLORS: Record<RankTier, string> = {
//   IRON: "#6B5B4F",
//   BRONZE: "#8B6914",
//   SILVER: "#8E9AAF",
//   GOLD: "#C8AA6E",
//   PLATINUM: "#4E9996",
//   EMERALD: "#009B5A",
//   DIAMOND: "#576BCE",
//   MASTER: "#9D48E0",
//   GRANDMASTER: "#CD4545",
//   CHALLENGER: "#F4C874",
// };

export const TIER_COLORS: Record<RankTier, string> = {
  IRON: "#514D4A",
  BRONZE: "#B07040",
  SILVER: "#A0A0A0",
  GOLD: "#C99B39",
  PLATINUM: "#46AAA0",
  EMERALD: "#00B27A",
  DIAMOND: "#5888FF",
  MASTER: "#A050FF",
  GRANDMASTER: "#DC3C3C",
  CHALLENGER: "#F5C846",
};

// Derive bg style from TIER_COLORS — no duplication
export function tierBgColor(tier: RankTier): string {
  return TIER_COLORS[tier];
}

// ─── Position Display ───
export const POSITION_LABELS: Record<Position, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

// ─── Queue IDs ───
export const QUEUE_FLEX = 440;
export const QUEUE_SOLO = 420;

// ─── Season Start (Jan 8, 2026 — buffered to noon Jan 7 UTC to avoid TZ edge cases) ───
export const SEASON_START_EPOCH = new Date("2026-01-08T12:00:00Z").getTime();

// ─── DDragon ───
export const DDRAGON_VERSION_URL =
  "https://ddragon.leagueoflegends.com/api/versions.json";

export function getChampionIconUrl(
  championName: string,
  version: string,
): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
}

export function getProfileIconUrl(iconId: number, version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}

// ─── LP to Tier Label ───
export function lpToTierLabel(totalLp: number): string {
  // Walk through tiers to find where this LP falls
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TIER_ORDER[i];
    if (totalLp >= TIER_BASE_LP[tier]) {
      const lpInTier = totalLp - TIER_BASE_LP[tier];
      const tierIndex = TIER_ORDER.indexOf(tier);
      // Iron–Diamond have 4 divisions
      if (tierIndex <= 6) {
        const divIndex = Math.min(Math.floor(lpInTier / 100), 3);
        const divLp = lpInTier - divIndex * 100;
        const divLabel = DIVISION_ORDER[divIndex];
        return `${tier.charAt(0)}${tier.slice(1).toLowerCase()} ${divLabel} · ${Math.round(divLp)} LP`;
      }
      // Master+ have no divisions
      return `${tier.charAt(0)}${tier.slice(1).toLowerCase()} · ${Math.round(lpInTier)} LP`;
    }
  }
  return `Iron IV · ${totalLp} LP`;
}

// ─── Challenge Target ───
export const CHALLENGER_LP = TIER_BASE_LP.CHALLENGER; // Total LP to reach Challenger
export const AVG_LP_PER_WIN = 20; // Estimated average LP gained per win

// ─── Min Games for "Best Of" ───
export const MIN_GAMES_FOR_BEST = 5;
