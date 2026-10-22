/**
 * CIR tiers — the single source for how a CIR score reads on screen.
 *
 * Thresholds, labels and colour classes live together so a badge, a table cell
 * and a leaderboard can never disagree about what "Great" means.
 */

export type CirTierKey =
  | "legendary"
  | "dominant"
  | "great"
  | "solid"
  | "average"
  | "poor";

export interface CirTier {
  key: CirTierKey;
  label: string;
  letter: string;
  /** Text colour class */
  text: string;
  /** Tinted surface + border classes for badges */
  soft: string;
}

const TIERS: { min: number; tier: CirTier }[] = [
  {
    min: 20,
    tier: {
      key: "legendary",
      label: "Legendary",
      letter: "L",
      text: "text-cir-legendary",
      soft: "bg-cir-legendary/10 border-cir-legendary/30",
    },
  },
  {
    min: 15,
    tier: {
      key: "dominant",
      label: "Dominant",
      letter: "D",
      text: "text-cir-dominant",
      soft: "bg-cir-dominant/10 border-cir-dominant/30",
    },
  },
  {
    min: 11,
    tier: {
      key: "great",
      label: "Great",
      letter: "G",
      text: "text-cir-great",
      soft: "bg-cir-great/10 border-cir-great/30",
    },
  },
  {
    min: 8,
    tier: {
      key: "solid",
      label: "Solid",
      letter: "S",
      text: "text-cir-solid",
      soft: "bg-cir-solid/10 border-cir-solid/30",
    },
  },
  {
    min: 6,
    tier: {
      key: "average",
      label: "Average",
      letter: "A",
      text: "text-cir-average",
      soft: "bg-cir-average/10 border-cir-average/25",
    },
  },
  {
    min: -Infinity,
    tier: {
      key: "poor",
      label: "Poor",
      letter: "P",
      text: "text-cir-poor",
      soft: "bg-cir-poor/10 border-cir-poor/30",
    },
  },
];

/** Score at or above which a performance counts as legendary. */
export const CIR_LEGENDARY_MIN = 20;
/** Score below which a performance counts as poor. */
export const CIR_POOR_BELOW = 6;

export function getCirTier(score: number): CirTier {
  return (TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1]).tier;
}

/** Text colour class for a CIR score. */
export function getCirColor(score: number): string {
  return getCirTier(score).text;
}
