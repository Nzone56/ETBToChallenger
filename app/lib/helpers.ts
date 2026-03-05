// ─── Re-export barrel ────────────────────────────────────────────────────────
// helpers.ts is kept as a compatibility shim. Import directly from the
// split modules for new code:
//   lib/format.ts        – getParticipant, calcKda, formatKda, calcWinrate, formatWinrate, calcCsPerMin
//   lib/aggregation.ts   – aggregatePlayerStats, EMPTY_STATS
//   lib/ranking.ts       – computeBestOfChallenge
//   lib/elo.ts           – computeAverageElo, lpToTierLabel, lpToTier
//   lib/groupMatches.ts  – findGroupMatches
//   lib/cir.ts           – computeCIR_v1, computeCIR_v2, statsToCircInput
// ─────────────────────────────────────────────────────────────────────────────

// suppress unused-import lint noise by re-exporting everything
export type { CIRInput, CIRResult } from "./cir";
export { computeCIR_v1, computeCIR_v2, statsToCircInput } from "./cir";
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
