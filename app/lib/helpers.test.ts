import { describe, it, expect } from "vitest";
import { aggregatePlayerStats } from "./helpers";
import type { Match, MatchParticipant } from "../types/riot";
import { SEASON_START_EPOCH } from "../data/constants";

// ─── Fixture helpers ───────────────────────────────────────────────────────

const PUUID = "test-puuid-player";
const ENEMY_PUUID = "test-puuid-enemy";
const AFTER_SEASON = SEASON_START_EPOCH + 1_000_000;

function makeParticipant(
  overrides: Partial<MatchParticipant> & { puuid: string },
): MatchParticipant {
  const defaults: Partial<MatchParticipant> = {
    riotIdGameName: "TestPlayer",
    riotIdTagline: "TEST",
    summonerName: "TestPlayer",
    championName: "Jinx",
    championId: 1,
    champLevel: 18,
    teamId: 100,
    teamPosition: "BOTTOM",
    individualPosition: "BOTTOM",
    role: "CARRY",
    win: true,
    kills: 0,
    deaths: 0,
    assists: 0,
    totalDamageDealtToChampions: 0,
    totalDamageTaken: 0,
    goldEarned: 0,
    goldSpent: 0,
    totalMinionsKilled: 0,
    neutralMinionsKilled: 0,
    visionScore: 0,
    wardsPlaced: 0,
    wardsKilled: 0,
    firstBloodKill: false,
    firstBloodAssist: false,
    damageDealtToBuildings: 0,
    damageDealtToObjectives: 0,
    doubleKills: 0,
    tripleKills: 0,
    quadraKills: 0,
    pentaKills: 0,
    turretKills: 0,
    inhibitorKills: 0,
    item0: 0,
    item1: 0,
    item2: 0,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 0,
    summoner1Id: 0,
    summoner2Id: 0,
    perks: { statPerks: { defense: 0, flex: 0, offense: 0 }, styles: [] },
  };
  return { ...defaults, ...overrides } as MatchParticipant;
}

function makeMatch(
  durationSeconds: number,
  player: Partial<MatchParticipant>,
  extraParticipants: Partial<MatchParticipant>[] = [],
): Match {
  const participants: MatchParticipant[] = [
    makeParticipant({ puuid: PUUID, ...player }),
    ...extraParticipants.map((p, i) =>
      makeParticipant({ puuid: `enemy-${i}`, teamId: 200, ...p }),
    ),
  ];

  return {
    metadata: { matchId: `LA1_test_${Math.random()}`, participants: [] },
    info: {
      gameId: 1,
      gameDuration: durationSeconds,
      gameStartTimestamp: AFTER_SEASON,
      gameCreation: AFTER_SEASON,
      queueId: 440,
      participants,
    },
  } as unknown as Match;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("aggregatePlayerStats", () => {
  it("returns zero stats when no matches", () => {
    const result = aggregatePlayerStats(PUUID, []);
    expect(result.totalGames).toBe(0);
    expect(result.winrate).toBe(0);
    expect(result.avgKills).toBe(0);
  });

  it("filters out matches before season start", () => {
    const oldMatch = makeMatch(1800, { kills: 10, win: true });
    oldMatch.info.gameStartTimestamp = SEASON_START_EPOCH - 1;
    const result = aggregatePlayerStats(PUUID, [oldMatch]);
    expect(result.totalGames).toBe(0);
  });

  describe("basic counting", () => {
    it("counts wins and losses correctly", () => {
      const matches = [
        makeMatch(1800, { win: true }),
        makeMatch(1800, { win: true }),
        makeMatch(1800, { win: false }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.totalGames).toBe(3);
      expect(r.wins).toBe(2);
      expect(r.losses).toBe(1);
      expect(r.winrate).toBeCloseTo(66.67, 1);
    });
  });

  describe("kills / deaths / assists / KDA", () => {
    it("averages K/D/A correctly", () => {
      const matches = [
        makeMatch(1800, { kills: 10, deaths: 2, assists: 5 }),
        makeMatch(1800, { kills: 4, deaths: 6, assists: 3 }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgKills).toBeCloseTo(7, 5);
      expect(r.avgDeaths).toBeCloseTo(4, 5);
      expect(r.avgAssists).toBeCloseTo(4, 5);
    });

    it("calculates KDA with deaths > 0", () => {
      // total: 14K 8D 8A → (14+8)/8 = 2.75
      const matches = [makeMatch(1800, { kills: 14, deaths: 8, assists: 8 })];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgKda).toBeCloseTo(2.75, 5);
    });

    it("calculates KDA with 0 deaths (perfect game)", () => {
      const matches = [makeMatch(1800, { kills: 5, deaths: 0, assists: 3 })];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgKda).toBe(8); // kills + assists
    });
  });

  describe("CS and CS/min", () => {
    it("computes avgCs and avgCsPerMin correctly", () => {
      // 30min game, 240 minions + 0 neutral = 240 CS → 8 CS/min
      const matches = [
        makeMatch(1800, { totalMinionsKilled: 220, neutralMinionsKilled: 20 }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgCs).toBe(240);
      expect(r.avgCsPerMin).toBeCloseTo(8, 5);
    });
  });

  describe("damage per minute", () => {
    it("computes avgDmgPerMin correctly", () => {
      // 30min game, 30000 damage → 1000 dmg/min
      const matches = [
        makeMatch(1800, { totalDamageDealtToChampions: 30_000 }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgDmgPerMin).toBeCloseTo(1000, 5);
    });
  });

  describe("gold per minute", () => {
    it("computes avgGoldPerMin correctly", () => {
      // 30min game, 15000 gold → 500 gold/min
      const matches = [makeMatch(1800, { goldEarned: 15_000 })];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgGoldPerMin).toBeCloseTo(500, 5);
    });
  });

  describe("vision per minute", () => {
    it("computes avgVisionScore as per-minute (not per-game)", () => {
      // 30min game, visionScore=30 → 1.0 vision/min
      const matches = [makeMatch(1800, { visionScore: 30 })];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgVisionScore).toBeCloseTo(1.0, 5);
    });

    it("averages vision/min across multiple games", () => {
      // game1: 20min, vision=20 → 1.0/min
      // game2: 40min, vision=20 → 0.5/min
      // avg = 0.75/min
      const matches = [
        makeMatch(1200, { visionScore: 20 }),
        makeMatch(2400, { visionScore: 20 }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgVisionScore).toBeCloseTo(0.75, 5);
    });
  });

  describe("kill participation", () => {
    it("computes KP as percentage of team kills", () => {
      // player: 3K 5A, team total kills = 10 → KP = 80%
      const match = makeMatch(1800, { kills: 3, assists: 5 }, []);
      // Add teammates manually on same team
      match.info.participants.push(
        makeParticipant({ puuid: "tm1", teamId: 100, kills: 2 }),
        makeParticipant({ puuid: "tm2", teamId: 100, kills: 5 }),
      );
      const r = aggregatePlayerStats(PUUID, [match]);
      // team kills = 3+2+5 = 10, player contribution = 3+5 = 8 → 80%
      expect(r.avgKillParticipation).toBeCloseTo(80, 1);
    });

    it("handles 0 team kills without dividing by zero", () => {
      const match = makeMatch(1800, { kills: 0, assists: 0 });
      const r = aggregatePlayerStats(PUUID, [match]);
      expect(r.avgKillParticipation).toBe(0);
    });
  });

  describe("first blood participation", () => {
    it("counts first blood kills", () => {
      const matches = [
        makeMatch(1800, { firstBloodKill: true }),
        makeMatch(1800, { firstBloodKill: false, firstBloodAssist: false }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.firstBloodParticipation).toBeCloseTo(50, 5);
    });

    it("counts first blood assists", () => {
      const matches = [
        makeMatch(1800, { firstBloodAssist: true }),
        makeMatch(1800, {}),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.firstBloodParticipation).toBeCloseTo(50, 5);
    });
  });

  describe("non-support stats (DMG/CS/Gold/min, buildings, objectives)", () => {
    it("excludes UTILITY games from noSupp stats", () => {
      const matches = [
        makeMatch(1800, {
          teamPosition: "BOTTOM",
          totalDamageDealtToChampions: 30_000,
          goldEarned: 15_000,
          totalMinionsKilled: 240,
        }),
        makeMatch(1800, {
          teamPosition: "UTILITY",
          totalDamageDealtToChampions: 10_000,
          goldEarned: 8_000,
          totalMinionsKilled: 20,
        }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.nonSuppGames).toBe(1);
      // Only the BOTTOM game counts: 30000/30min = 1000 dmg/min
      expect(r.avgDmgPerMinNoSupp).toBeCloseTo(1000, 5);
      expect(r.avgGoldPerMinNoSupp).toBeCloseTo(500, 5);
      expect(r.avgCsPerMinNoSupp).toBeCloseTo(8, 5);
    });

    it("excludes UTILITY games from buildings and objectives", () => {
      const matches = [
        makeMatch(1800, {
          teamPosition: "TOP",
          damageDealtToBuildings: 5000,
          damageDealtToObjectives: 3000,
        }),
        makeMatch(1800, {
          teamPosition: "UTILITY",
          damageDealtToBuildings: 9999,
          damageDealtToObjectives: 9999,
        }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.avgDmgToBuildings).toBeCloseTo(5000, 5);
      expect(r.avgDmgToObjectives).toBeCloseTo(3000, 5);
    });
  });

  describe("gold lead and damage lead vs lane opponent", () => {
    it("computes gold lead vs same-position enemy", () => {
      // Player: 15000 gold, opponent (enemy BOTTOM): 12000 gold → +3000 lead
      const match = makeMatch(1800, {
        teamPosition: "BOTTOM",
        goldEarned: 15_000,
      });
      match.info.participants.push(
        makeParticipant({
          puuid: ENEMY_PUUID,
          teamId: 200,
          teamPosition: "BOTTOM",
          goldEarned: 12_000,
        }),
      );
      const r = aggregatePlayerStats(PUUID, [match]);
      expect(r.goldLeadGames).toBe(1);
      expect(r.avgGoldLead).toBeCloseTo(3000, 5);
    });

    it("computes damage lead vs same-position enemy", () => {
      const match = makeMatch(1800, {
        teamPosition: "MIDDLE",
        totalDamageDealtToChampions: 40_000,
      });
      match.info.participants.push(
        makeParticipant({
          puuid: ENEMY_PUUID,
          teamId: 200,
          teamPosition: "MIDDLE",
          totalDamageDealtToChampions: 25_000,
        }),
      );
      const r = aggregatePlayerStats(PUUID, [match]);
      expect(r.avgDmgLead).toBeCloseTo(15_000, 5);
    });

    it("skips gold/dmg lead when no lane opponent found", () => {
      // Player is JUNGLE, no enemy JUNGLE in participants
      const match = makeMatch(1800, { teamPosition: "JUNGLE" });
      const r = aggregatePlayerStats(PUUID, [match]);
      expect(r.goldLeadGames).toBe(0);
      expect(r.avgGoldLead).toBe(0);
    });

    it("skips gold/dmg lead when teamPosition is empty", () => {
      const match = makeMatch(1800, { teamPosition: "" });
      const r = aggregatePlayerStats(PUUID, [match]);
      expect(r.goldLeadGames).toBe(0);
    });
  });

  describe("champion stats", () => {
    it("tracks wins/losses per champion", () => {
      const matches = [
        makeMatch(1800, { championName: "Jinx", win: true }),
        makeMatch(1800, { championName: "Jinx", win: true }),
        makeMatch(1800, { championName: "Jinx", win: false }),
        makeMatch(1800, { championName: "Caitlyn", win: true }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      const jinx = r.championStats.find((c) => c.championName === "Jinx")!;
      const cait = r.championStats.find((c) => c.championName === "Caitlyn")!;
      expect(jinx.games).toBe(3);
      expect(jinx.wins).toBe(2);
      expect(jinx.losses).toBe(1);
      expect(cait.games).toBe(1);
      expect(cait.wins).toBe(1);
    });

    it("sorts champions by games played descending", () => {
      const matches = [
        makeMatch(1800, { championName: "Caitlyn" }),
        makeMatch(1800, { championName: "Jinx" }),
        makeMatch(1800, { championName: "Jinx" }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.championStats[0].championName).toBe("Jinx");
    });
  });

  describe("role stats and primaryRole", () => {
    it("identifies primary role as most played position", () => {
      const matches = [
        makeMatch(1800, { teamPosition: "BOTTOM" }),
        makeMatch(1800, { teamPosition: "BOTTOM" }),
        makeMatch(1800, { teamPosition: "MIDDLE" }),
      ];
      const r = aggregatePlayerStats(PUUID, matches);
      expect(r.primaryRole).toBe("BOTTOM");
    });

    it("returns null primaryRole when no position data", () => {
      const match = makeMatch(1800, { teamPosition: "" });
      const r = aggregatePlayerStats(PUUID, [match]);
      expect(r.primaryRole).toBeNull();
    });
  });
});
