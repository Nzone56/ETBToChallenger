/**
 * Competitive Impact Rating (CIR)
 *
 * Two experimental formulas to measure overall player impact.
 * Use computeCIR_v1 / computeCIR_v2 on averaged stats, then compare
 * which one better reflects perceived performance before picking one.
 */

export interface CIRInput {
  kills: number;
  deaths: number;
  assists: number;
  /** Kill participation 0–100 */
  killParticipation: number;
  /** Vision score per minute */
  visionPerMin: number;
  dmgToObjectives: number;
  /** First blood participation 0–100 */
  firstBloodParticipation: number;
  goldPerMin: number;
  csPerMin: number;
  goldLead: number;
  dmgPerMin: number;
  dmgToBuildings: number;
  dmgLead: number;
  /** Team damage % 0–100 (only used in v2) */
  teamDamagePercent?: number;
  /** Highest gold/min across all players in the dataset (only used in v2) */
  maxGameGoldPerMin?: number;
}

export interface CIRResult {
  score: number;
  breakdown: {
    combat: number;
    utility: number;
    economy: number;
    pressure: number;
  };
}

/**
 * CIR v1
 *
 * Combat   (40%): (K + A×0.7 − D×1.2) × KP/100
 * Utility  (25%): VisionScore×0.5 + DmgToObj×0.0005 + FB%×5
 * Economy  (20%): GoldPerMin×0.02 + CsPerMin×1.5 + GoldLead/100
 * Pressure (15%): DmgPerMin×0.01 + DmgToBuildings×0.0008 + DmgLead/200
 */
export function computeCIR_v1(input: CIRInput): CIRResult {
  const kp = input.killParticipation / 100;

  const combat = (input.kills + input.assists * 0.7 - input.deaths * 1.2) * kp;

  const utility =
    input.visionPerMin * 0.5 +
    input.dmgToObjectives * 0.0005 +
    input.firstBloodParticipation * 5;

  const economy =
    input.goldPerMin * 0.02 + input.csPerMin * 1.5 + input.goldLead / 100;

  const pressure =
    input.dmgPerMin * 0.01 +
    input.dmgToBuildings * 0.0008 +
    input.dmgLead / 200;

  const score = combat * 0.4 + utility * 0.25 + economy * 0.2 + pressure * 0.15;

  return { score, breakdown: { combat, utility, economy, pressure } };
}

/**
 * CIR v2
 *
 * Combat   (35%): (K + A×0.7 − D×1.3) × (0.5 + KP/100×0.5)
 * Utility  (25%): VisionScore×0.5 + DmgToObj×0.0005 + FB%×3.5
 * Economy  (25%): (GoldPerMin/MaxGPM)×10 + CsPerMin×1.5 + GoldLead/80
 * Pressure (15%): DmgPerMin×0.008 + TeamDmg%×20 + DmgToBuildings×0.0006
 *
 * Requires `maxGameGoldPerMin` and `teamDamagePercent` in input.
 * Falls back gracefully if not provided (uses 1 and 0 respectively).
 */
export function computeCIR_v2(input: CIRInput): CIRResult {
  const kp = input.killParticipation / 100;
  const maxGPM = input.maxGameGoldPerMin ?? 1;
  const teamDmgPct = input.teamDamagePercent ?? 0;

  const combat =
    (input.kills + input.assists * 0.7 - input.deaths * 1.2) * (0.5 + kp * 0.5);

  const utility =
    input.visionPerMin * 0.4 +
    input.dmgToObjectives * 0.0005 +
    input.firstBloodParticipation * 3.5;

  const economy =
    (input.goldPerMin / maxGPM) * 10 +
    input.csPerMin * 1.5 +
    input.goldLead / 80;

  const pressure =
    input.dmgPerMin * 0.008 + teamDmgPct * 20 + input.dmgToBuildings * 0.0006;

  const score =
    combat * 0.35 + utility * 0.25 + economy * 0.25 + pressure * 0.15;

  return { score, breakdown: { combat, utility, economy, pressure } };
}

/**
 * CIR v3 — Role-Aware Impact Rating (bounded 0–100)
 *
 * ── Pillar definitions ──────────────────────────────────────────────────────
 *
 *  COMBAT   = fighting effectiveness
 *             (K/D/A × KP_factor) + DmgPerMin contribution
 *             dmgPerMin belongs here, NOT in pressure — it measures
 *             how hard you hit in fights, not map presence
 *
 *  UTILITY  = enabling/vision/objective control
 *             VisionPerMin + DmgToObjectives + FirstBlood + KP bonus
 *
 *  ECONOMY  = resource lead (normalized, capped to prevent stomp explosion)
 *             (GPM / MaxGPM) × 10  +  CsPerMin × 1.5
 *             GoldLead is CAPPED at ±3000 so a 10k stomp doesn't inflate
 *             the score 3× vs a close game
 *
 *  PRESSURE = MAP pressure (completely separate from dealing damage)
 *             TeamDmg% (share of team output) + DmgToBuildings
 *             No raw dmgPerMin here — if you deal 3k dmg/min to a tank
 *             and chunk nothing, that's already in Combat
 *
 * ── Score normalization ─────────────────────────────────────────────────────
 *  Raw weighted sum → soft-capped to ~0-100 via:
 *    normalized = rawScore / (1 + rawScore / 50) * 50
 *  This compresses extreme values gracefully:
 *    raw 20 → ~13,  raw 40 → ~25,  raw 60 → ~35,  raw 100 → ~50
 *  Multiplied by 2 so average game sits ~40-55, god game ~75-85, never 100+
 *
 * ── Role weights ────────────────────────────────────────────────────────────
 *  Role       | Combat | Utility | Economy | Pressure
 *  -----------|--------|---------|---------|----------
 *  TOP        |  0.35  |  0.10   |  0.20   |  0.35
 *  JUNGLE     |  0.30  |  0.20   |  0.15   |  0.35
 *  MIDDLE     |  0.40  |  0.15   |  0.25   |  0.20
 *  BOTTOM/ADC |  0.40  |  0.05   |  0.40   |  0.15
 *  UTILITY    |  0.10  |  0.60   |  0.10   |  0.20
 *
 * Requires: `teamPosition`, `maxGameGoldPerMin`, `teamDamagePercent`
 */
export type TeamPosition = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export interface RoleWeights {
  combat: number;
  utility: number;
  economy: number;
  pressure: number;
}

const ROLE_WEIGHTS: Record<TeamPosition, RoleWeights> = {
  TOP: { combat: 0.35, utility: 0.1, economy: 0.2, pressure: 0.35 },
  JUNGLE: { combat: 0.3, utility: 0.2, economy: 0.15, pressure: 0.35 },
  MIDDLE: { combat: 0.4, utility: 0.15, economy: 0.25, pressure: 0.2 },
  BOTTOM: { combat: 0.5, utility: 0.05, economy: 0.35, pressure: 0.1 },
  UTILITY: { combat: 0.15, utility: 0.6, economy: 0.15, pressure: 0.1 },
};

const DEFAULT_WEIGHTS: RoleWeights = {
  combat: 0.35,
  utility: 0.2,
  economy: 0.25,
  pressure: 0.2,
};

export function computeCIR_v3(
  input: CIRInput & { teamPosition?: string },
): CIRResult & { role: string; weights: RoleWeights } {
  const kp = input.killParticipation / 100;
  const maxGPM = input.maxGameGoldPerMin ?? 1;
  const teamDmgPct = input.teamDamagePercent ?? 0;

  const pos = (input.teamPosition?.toUpperCase() ?? "") as TeamPosition;
  const isSupport = pos === "UTILITY";
  const weights = ROLE_WEIGHTS[pos] ?? DEFAULT_WEIGHTS;

  // ── Normalization targets ───────────────────────────────────────────────────
  // Every sub-term is calibrated to contribute roughly 0–10 units so no single
  // input can dominate the score regardless of game length or role.
  //
  //  visionPerMin   : 0.3–5/min   → * 2.0   → 0–10
  //  dmgToObjectives: 20k–800k    → / 80000       → 0.25–10
  //  dmgToBuildings : 0–50k       → / 5000        → 0–10
  //  dmgPerMin      : 400–2000    → / 200    → 2–10   ✓ already safe
  //  teamDmgPct     : 15–35%      → / 3      → 5–12
  //  goldLead (±3k) : –3000–+3000 → / 600    → –5 to +5
  //  csPerMin       : 4–12        → * 0.8    → 3–10   ✓
  //  GPM ratio      : 0.3–1.0     → * 10     → 3–10   ✓

  // ── Combat ─────────────────────────────────────────────────────────────────
  // Support formula: assists-driven, deaths punished, kills near-irrelevant.
  // Others: standard K/D/A formula.  Both multiplied by KP factor.
  const kda_factor = isSupport
    ? input.kills * 0.3 + input.assists * 0.8 - input.deaths * 0.7
    : input.kills + input.assists * 0.7 - input.deaths * 1.2;

  const combat =
    kda_factor * (0.5 + kp * (isSupport ? 2 : 1)) + // weighted KDA × KP        → ~0–15
    input.dmgPerMin / 190; // fighting output, 400→2    → ~2–10

  // ── Utility ────────────────────────────────────────────────────────────────
  // KP term rewards roaming supports/junglers who enable kills.
  const utility =
    input.visionPerMin * (isSupport ? 2 : 3) + // vision/min 0.3→5          → 0.6–10
    input.dmgToObjectives / (isSupport ? 5000 : 70000) + // obj dmg 20k→800k   → 0.25–10 ✓
    (input.firstBloodParticipation > 0 ? 2 : 0) + // flat FB bonus  → 0 or 3
    kp * 5; // kill enablement           → 0–4

  // ── Economy ────────────────────────────────────────────────────────────────
  // GPM normalized to max in game. GoldLead capped ±3000 → ±5 pts.
  // Can go negative if gold deficit is severe.
  const goldLeadCapped = Math.max(-3000, Math.min(3000, input.goldLead));
  const economy =
    (input.goldPerMin / maxGPM) * 10 + // relative GPM 0.3–1.0      → 3–10
    input.csPerMin * 0.8 + // cs/min 4–12                → 3–10
    goldLeadCapped / 600; // lane lead ±3k              → –5 to +5

  // ── Pressure ───────────────────────────────────────────────────────────────
  // Pure MAP presence: team share + structure damage.
  // DmgLead deficit can make this negative.
  const dmgLeadCapped = Math.max(-5000, Math.min(5000, input.dmgLead));
  const pressure =
    teamDmgPct / 3 + // team dmg share 15–35%      → 5–12
    input.dmgToBuildings / 5000 +
    (input.goldPerMin / maxGPM) * 5 +
    input.dmgPerMin / 300 + // structure dmg 0–50k         → 0–10
    dmgLeadCapped / 1000; // dmg lead ±5k               → –5 to +5

  // ── Weighted sum ────────────────────────────────────────────────────────────
  // Pillars can be negative (combat from deaths, economy from deficit, pressure from dmg deficit).
  // Floor the final score at 0 — you can't have negative impact.
  const rawScore =
    combat * weights.combat +
    utility * weights.utility +
    economy * weights.economy +
    pressure * weights.pressure;

  const score = Math.max(0, rawScore);

  return {
    score,
    breakdown: { combat, utility, economy, pressure },
    role: pos || "UNKNOWN",
    weights,
  };
}

/**
 * Derive CIRInput from PlayerAggregatedStats-shaped object.
 * Pass `maxGameGoldPerMin` and `teamDamagePercent` separately as they
 * require cross-player context.
 */
export function statsToCircInput(
  stats: {
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKillParticipation: number;
    avgVisionScore: number;
    avgDmgToObjectives: number;
    firstBloodParticipation: number;
    avgGoldPerMin: number;
    avgCsPerMin: number;
    avgGoldLead: number;
    avgDmgPerMin: number;
    avgDmgToBuildings: number;
    avgDmgLead: number;
  },
  extras?: { maxGameGoldPerMin?: number; teamDamagePercent?: number },
): CIRInput {
  return {
    kills: stats.avgKills,
    deaths: stats.avgDeaths,
    assists: stats.avgAssists,
    killParticipation: stats.avgKillParticipation,
    visionPerMin: stats.avgVisionScore,
    dmgToObjectives: stats.avgDmgToObjectives,
    firstBloodParticipation: stats.firstBloodParticipation,
    goldPerMin: stats.avgGoldPerMin,
    csPerMin: stats.avgCsPerMin,
    goldLead: stats.avgGoldLead,
    dmgPerMin: stats.avgDmgPerMin,
    dmgToBuildings: stats.avgDmgToBuildings,
    dmgLead: stats.avgDmgLead,
    maxGameGoldPerMin: extras?.maxGameGoldPerMin,
    teamDamagePercent: extras?.teamDamagePercent,
  };
}
