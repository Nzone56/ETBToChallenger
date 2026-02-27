import { LeagueEntry } from "../types/riot";
import { rankToLp, TIER_ORDER, TIER_BASE_LP } from "../data/constants";

// ─── Average team Elo ───
export function computeAverageElo(entries: (LeagueEntry | null)[]): {
  avgLp: number;
  avgTierLabel: string;
} {
  const validEntries = entries.filter((e): e is LeagueEntry => e !== null);
  if (validEntries.length === 0) return { avgLp: 0, avgTierLabel: "Unranked" };

  const totalLp = validEntries.reduce(
    (sum, e) => sum + rankToLp(e.tier, e.rank, e.leaguePoints),
    0,
  );
  const avgLp = Math.round(totalLp / validEntries.length);
  return { avgLp, avgTierLabel: lpToTierLabel(avgLp) };
}

// ─── Reverse-map total LP to a tier + division label ───
export function lpToTierLabel(lp: number): string {
  let matchedTier = TIER_ORDER[0];
  for (const tier of TIER_ORDER) {
    if (lp >= TIER_BASE_LP[tier]) matchedTier = tier;
    else break;
  }

  const tierIndex = TIER_ORDER.indexOf(matchedTier);
  const formatted =
    matchedTier.charAt(0) + matchedTier.slice(1).toLowerCase();

  if (tierIndex <= 6) {
    const lpInTier = lp - TIER_BASE_LP[matchedTier];
    const divisions = ["IV", "III", "II", "I"];
    const divIndex = Math.min(Math.floor(lpInTier / 100), 3);
    return `${formatted} ${divisions[divIndex]}`;
  }

  return formatted;
}

// ─── Get the RankTier key from total LP (for emblem rendering) ───
export function lpToTier(lp: number): string {
  let matchedTier = TIER_ORDER[0];
  for (const tier of TIER_ORDER) {
    if (lp >= TIER_BASE_LP[tier]) matchedTier = tier;
    else break;
  }
  return matchedTier;
}
