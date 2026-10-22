import { computeParticipantCir } from "./cir";
import { isRemake } from "./format";
import type { Match, MatchParticipant } from "../types/riot";

export interface ParticipantView extends MatchParticipant {
  cir: number;
  isChallengePlayer: boolean;
}

export interface TeamTotals {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  damageTaken: number;
  gold: number;
  cs: number;
  vision: number;
  towers: number;
  dragons: number;
  barons: number;
  heralds: number;
}

export interface TeamView {
  teamId: 100 | 200;
  side: "blue" | "red";
  win: boolean;
  participants: ParticipantView[];
  totals: TeamTotals;
}

export interface MatchView {
  remake: boolean;
  teams: [TeamView, TeamView];
  mvp: ParticipantView | null;
  challengeParticipants: ParticipantView[];
}

const POSITION_ORDER: Record<string, number> = {
  TOP: 0,
  JUNGLE: 1,
  MIDDLE: 2,
  BOTTOM: 3,
  UTILITY: 4,
};

function sum(ps: MatchParticipant[], pick: (p: MatchParticipant) => number) {
  return ps.reduce((s, p) => s + pick(p), 0);
}

/**
 * Everything the match page renders, computed once: each participant's CIR,
 * teams in lane order, team totals and objectives, and the MVP.
 */
export function buildMatchView(match: Match, challengePuuids: Set<string>): MatchView {
  const remake = isRemake(match.info.gameDuration);

  const all: ParticipantView[] = match.info.participants.map((p) => ({
    ...p,
    cir: remake ? 0 : computeParticipantCir(match, p).score,
    isChallengePlayer: challengePuuids.has(p.puuid),
  }));

  const team = (teamId: 100 | 200): TeamView => {
    const participants = all
      .filter((p) => p.teamId === teamId)
      .sort((a, b) => (POSITION_ORDER[a.teamPosition] ?? 9) - (POSITION_ORDER[b.teamPosition] ?? 9));
    const objectives = match.info.teams.find((t) => t.teamId === teamId)?.objectives ?? {};
    return {
      teamId,
      side: teamId === 100 ? "blue" : "red",
      win: match.info.teams.find((t) => t.teamId === teamId)?.win ?? false,
      participants,
      totals: {
        kills: sum(participants, (p) => p.kills),
        deaths: sum(participants, (p) => p.deaths),
        assists: sum(participants, (p) => p.assists),
        damage: sum(participants, (p) => p.totalDamageDealtToChampions),
        damageTaken: sum(participants, (p) => p.totalDamageTaken),
        gold: sum(participants, (p) => p.goldEarned),
        cs: sum(participants, (p) => p.totalMinionsKilled + p.neutralMinionsKilled),
        vision: sum(participants, (p) => p.visionScore),
        towers: objectives.tower?.kills ?? 0,
        dragons: objectives.dragon?.kills ?? 0,
        barons: objectives.baron?.kills ?? 0,
        heralds: objectives.riftHerald?.kills ?? 0,
      },
    };
  };

  const mvp = remake || all.length === 0 ? null : all.reduce((best, p) => (p.cir > best.cir ? p : best));

  return {
    remake,
    teams: [team(100), team(200)],
    mvp,
    challengeParticipants: all.filter((p) => p.isChallengePlayer),
  };
}
