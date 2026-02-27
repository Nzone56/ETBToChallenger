import { describe, it, expect } from "vitest";
import { computeCIR_v3 } from "./cir";
import type { CIRInput } from "./cir";

// ─── Realistic base inputs per role ─────────────────────────────────────────
// Values sourced from typical Diamond/Master ranked game averages.
// Each scenario is hand-labelled so we know what score tier to expect.

// Typical BOTTOM (ADC) average game — not remarkable, not int
const ADC_AVERAGE: CIRInput & { teamPosition: string } = {
  teamPosition: "BOTTOM",
  kills: 6,
  deaths: 4,
  assists: 5,
  killParticipation: 65, // 65%
  visionPerMin: 0.6, // 19 vision / 32min
  dmgToObjectives: 45_000, // typical ADC: some turret/drake hits
  firstBloodParticipation: 0,
  goldPerMin: 450,
  csPerMin: 8.5,
  goldLead: 800,
  dmgPerMin: 950,
  dmgToBuildings: 8_000,
  dmgLead: 5_000,
  teamDamagePercent: 30,
  maxGameGoldPerMin: 500,
};

// Stomping ADC — 15/2/8, fed, ahead in gold
const ADC_STOMP: CIRInput & { teamPosition: string } = {
  ...ADC_AVERAGE,
  kills: 15,
  deaths: 2,
  assists: 8,
  killParticipation: 82,
  goldPerMin: 490,
  csPerMin: 9.8,
  goldLead: 3500, // will be capped at 3000
  dmgPerMin: 1600,
  dmgToObjectives: 120_000,
  dmgToBuildings: 22_000,
  teamDamagePercent: 38,
  maxGameGoldPerMin: 500,
};

// Inting ADC — 2/10/3
const ADC_INTING: CIRInput & { teamPosition: string } = {
  ...ADC_AVERAGE,
  kills: 2,
  deaths: 10,
  assists: 3,
  killParticipation: 30,
  goldPerMin: 340,
  csPerMin: 6.2,
  goldLead: -2500,
  dmgPerMin: 420,
  dmgToObjectives: 15_000,
  dmgToBuildings: 1_000,
  teamDamagePercent: 15,
  maxGameGoldPerMin: 500,
};

// Typical UTILITY (Enchanter Support) — 0/3/14, good vision
const SUPP_AVERAGE: CIRInput & { teamPosition: string } = {
  teamPosition: "UTILITY",
  kills: 0,
  deaths: 3,
  assists: 14,
  killParticipation: 70,
  visionPerMin: 2.8, // 90 vision / 32min — supports ward a lot
  dmgToObjectives: 8_000, // enchanters do very little obj dmg
  firstBloodParticipation: 0,
  goldPerMin: 210,
  csPerMin: 0.5, // support cs
  goldLead: -1200, // supports are always behind in gold vs carry
  dmgPerMin: 180,
  dmgToBuildings: 500,
  dmgLead: -8_000,
  teamDamagePercent: 8,
  maxGameGoldPerMin: 500,
};

// Dominant Support — 0/1/20, 150 vision score
const SUPP_DOMINANT: CIRInput & { teamPosition: string } = {
  ...SUPP_AVERAGE,
  kills: 1,
  deaths: 1,
  assists: 20,
  killParticipation: 85,
  visionPerMin: 4.2, // 134 vision / 32min
  firstBloodParticipation: 100,
  goldLead: -500,
};

// Typical JUNGLE — 5/4/10, decent obj control
const JUNGLE_AVERAGE: CIRInput & { teamPosition: string } = {
  teamPosition: "JUNGLE",
  kills: 5,
  deaths: 4,
  assists: 10,
  killParticipation: 60,
  visionPerMin: 1.0,
  dmgToObjectives: 200_000, // junglers do baron/dragon — very high
  firstBloodParticipation: 100, // junglers often get first blood
  goldPerMin: 390,
  csPerMin: 5.5,
  goldLead: 200,
  dmgPerMin: 700,
  dmgToBuildings: 6_000,
  dmgLead: 0,
  teamDamagePercent: 20,
  maxGameGoldPerMin: 500,
};

// Typical MID laner — 7/4/6, roaming damage dealer
const MID_AVERAGE: CIRInput & { teamPosition: string } = {
  teamPosition: "MIDDLE",
  kills: 7,
  deaths: 4,
  assists: 6,
  killParticipation: 65,
  visionPerMin: 0.9,
  dmgToObjectives: 60_000,
  firstBloodParticipation: 0,
  goldPerMin: 430,
  csPerMin: 8.0,
  goldLead: 1200,
  dmgPerMin: 1100,
  dmgToBuildings: 12_000,
  dmgLead: 8_000,
  teamDamagePercent: 28,
  maxGameGoldPerMin: 500,
};

// Typical TOP — 4/3/4, split pusher
const TOP_AVERAGE: CIRInput & { teamPosition: string } = {
  teamPosition: "TOP",
  kills: 4,
  deaths: 3,
  assists: 4,
  killParticipation: 45,
  visionPerMin: 0.7,
  dmgToObjectives: 40_000,
  firstBloodParticipation: 0,
  goldPerMin: 410,
  csPerMin: 8.2,
  goldLead: 600,
  dmgPerMin: 800,
  dmgToBuildings: 18_000, // tops split push more
  dmgLead: 3_000,
  teamDamagePercent: 22,
  maxGameGoldPerMin: 500,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("computeCIR_v3 — calibration & sanity", () => {
  describe("score is non-negative (open scale)", () => {
    it("inting ADC is above 0 (not negative)", () => {
      const { score } = computeCIR_v3(ADC_INTING);
      expect(score).toBeGreaterThan(0);
    });

    it("all roles produce a positive score", () => {
      const scenarios = [
        ADC_AVERAGE,
        ADC_STOMP,
        ADC_INTING,
        SUPP_AVERAGE,
        SUPP_DOMINANT,
        JUNGLE_AVERAGE,
        MID_AVERAGE,
        TOP_AVERAGE,
      ];
      for (const s of scenarios) {
        const { score } = computeCIR_v3(s);
        expect(score).toBeGreaterThan(0);
      }
    });
  });

  describe("relative ordering makes sense", () => {
    it("stomp ADC scores higher than average ADC", () => {
      const stomp = computeCIR_v3(ADC_STOMP).score;
      const avg = computeCIR_v3(ADC_AVERAGE).score;
      expect(stomp).toBeGreaterThan(avg);
    });

    it("average ADC scores higher than inting ADC", () => {
      const avg = computeCIR_v3(ADC_AVERAGE).score;
      const int = computeCIR_v3(ADC_INTING).score;
      expect(avg).toBeGreaterThan(int);
    });

    it("dominant support scores higher than average support", () => {
      const dom = computeCIR_v3(SUPP_DOMINANT).score;
      const avg = computeCIR_v3(SUPP_AVERAGE).score;
      expect(dom).toBeGreaterThan(avg);
    });
  });

  describe("expected score tiers (open scale)", () => {
    it("average ADC is above 9 (raw ~12)", () => {
      const { score } = computeCIR_v3(ADC_AVERAGE);
      expect(score).toBeGreaterThan(9);
    });

    it("average support is above 4 (utility-heavy, lower raw)", () => {
      const { score } = computeCIR_v3(SUPP_AVERAGE);
      expect(score).toBeGreaterThan(4);
    });

    it("stomp ADC is higher than average ADC", () => {
      const stomp = computeCIR_v3(ADC_STOMP).score;
      const avg = computeCIR_v3(ADC_AVERAGE).score;
      expect(stomp).toBeGreaterThan(avg * 1.3);
    });

    it("inting ADC is below average ADC", () => {
      const int = computeCIR_v3(ADC_INTING).score;
      const avg = computeCIR_v3(ADC_AVERAGE).score;
      expect(int).toBeLessThan(avg * 0.7);
    });
  });

  describe("role-aware pillar checks", () => {
    it("support role uses UTILITY weights (0.60)", () => {
      const { weights } = computeCIR_v3(SUPP_AVERAGE);
      expect(weights.utility).toBe(0.6);
      expect(weights.combat).toBe(0.15);
    });

    it("ADC role uses ECONOMY weights (0.35)", () => {
      const { weights } = computeCIR_v3(ADC_AVERAGE);
      expect(weights.economy).toBe(0.35);
    });

    it("TOP role uses PRESSURE weights (0.35)", () => {
      const { weights } = computeCIR_v3(TOP_AVERAGE);
      expect(weights.pressure).toBe(0.35);
    });

    it("JUNGLE role uses PRESSURE weights (0.35)", () => {
      const { weights } = computeCIR_v3(JUNGLE_AVERAGE);
      expect(weights.pressure).toBe(0.35);
    });

    it("role is correctly assigned from teamPosition", () => {
      expect(computeCIR_v3(SUPP_AVERAGE).role).toBe("UTILITY");
      expect(computeCIR_v3(ADC_AVERAGE).role).toBe("BOTTOM");
      expect(computeCIR_v3(JUNGLE_AVERAGE).role).toBe("JUNGLE");
    });
  });

  describe("goldLead cap prevents stomp inflation", () => {
    it("10k gold lead is treated the same as 3k gold lead", () => {
      const capped = computeCIR_v3({ ...ADC_AVERAGE, goldLead: 10_000 }).score;
      const maxCapped = computeCIR_v3({
        ...ADC_AVERAGE,
        goldLead: 3_000,
      }).score;
      expect(capped).toBeCloseTo(maxCapped, 1);
    });

    it("–10k gold deficit is treated the same as –3k", () => {
      const deepDeficit = computeCIR_v3({
        ...ADC_AVERAGE,
        goldLead: -10_000,
      }).score;
      const cappedDeficit = computeCIR_v3({
        ...ADC_AVERAGE,
        goldLead: -3_000,
      }).score;
      expect(deepDeficit).toBeCloseTo(cappedDeficit, 1);
    });
  });

  describe("utility pillar sub-terms are bounded", () => {
    it("max dmgToObjectives (800k) does not crash", () => {
      expect(() =>
        computeCIR_v3({ ...JUNGLE_AVERAGE, dmgToObjectives: 800_000 }),
      ).not.toThrow();
    });

    it("dmgToObjectives 0 doesn't crash (no divide by zero)", () => {
      expect(() =>
        computeCIR_v3({ ...ADC_AVERAGE, dmgToObjectives: 0 }),
      ).not.toThrow();
    });

    it("extreme dmgToBuildings (50k) does not crash", () => {
      expect(() =>
        computeCIR_v3({ ...TOP_AVERAGE, dmgToBuildings: 50_000 }),
      ).not.toThrow();
    });
  });

  describe("no time-sensitive explosion", () => {
    it("short game (20min) vs long game (45min) with same per-min stats give similar scores", () => {
      // Simulate same *quality* of play but different durations
      // Per-min stats stay the same — only raw totals change
      const shortGame: CIRInput & { teamPosition: string } = {
        ...ADC_AVERAGE,
        dmgToObjectives: 30_000, // less time = less obj dmg
        dmgToBuildings: 5_000,
      };
      const longGame: CIRInput & { teamPosition: string } = {
        ...ADC_AVERAGE,
        dmgToObjectives: 80_000, // more time = more obj dmg accumulated
        dmgToBuildings: 15_000,
      };
      const short = computeCIR_v3(shortGame).score;
      const long = computeCIR_v3(longGame).score;
      // Longer game can score somewhat higher due to more objective involvement
      // but shouldn't be MORE THAN 2x the short game score
      expect(long / short).toBeLessThan(2);
    });
  });
});
