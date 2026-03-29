// ─── Re-export barrel ────────────────────────────────────────────────────────
// Convenience barrel for commonly used utilities across the app.
// Import from here for simplicity, or directly from split modules if preferred:
//   lib/format.ts        – getParticipant, calcKda, formatKda, calcWinrate, formatWinrate, calcCsPerMin, isRemake
//   lib/aggregation.ts   – aggregatePlayerStats, EMPTY_STATS
//   lib/ranking.ts       – computeBestOfChallenge
//   lib/elo.ts           – computeAverageElo, lpToTierLabel, lpToTier
//   lib/groupMatches.ts  – findGroupMatches
//   lib/cir.ts           – statsToCircInput
// ─────────────────────────────────────────────────────────────────────────────

// suppress unused-import lint noise by re-exporting everything
export type { CIRInput, CIRResult } from "./cir";
export { statsToCircInput } from "./cir";
export {
  getParticipant,
  calcKda,
  formatKda,
  calcWinrate,
  formatWinrate,
  calcCsPerMin,
  isRemake,
  REMAKE_THRESHOLD_SECONDS,
} from "./format";
export { aggregatePlayerStats, EMPTY_STATS } from "./aggregation";
export { computeBestOfChallenge } from "./ranking";
export { computeAverageElo, lpToTierLabel, lpToTier } from "./elo";
export { findGroupMatches } from "./groupMatches";
