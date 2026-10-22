import type { PlayerStackStats } from "@/app/lib/db";
import type { RosterPlayer } from "@/app/lib/roster";
import type { Position } from "@/app/types/riot";

export type RoleFilter = "ALL" | Position;
export type StackFilter = "all" | "solo" | "duo" | "trio" | "penta";

export interface LeaderboardRow {
  player: RosterPlayer;
  wins: number;
  games: number;
  winrate: number;
}

const STACK_FIELDS: Record<
  Exclude<StackFilter, "all">,
  { games: keyof PlayerStackStats; wins: keyof PlayerStackStats }
> = {
  solo: { games: "soloGames", wins: "soloWins" },
  duo: { games: "duoGames", wins: "duoWins" },
  trio: { games: "trioGames", wins: "trioWins" },
  penta: { games: "pentaGames", wins: "pentaWins" },
};

/**
 * Leaderboard rows for one filter. Role and stack filters are exclusive (the
 * data has no role × stack breakdown), so callers reset one when the other
 * changes. Overall ranks by ladder LP; any filter ranks by winrate.
 */
export function buildLeaderboardRows(
  players: RosterPlayer[],
  stackStats: PlayerStackStats[],
  role: RoleFilter,
  stack: StackFilter,
): LeaderboardRow[] {
  const stackMap = new Map(stackStats.map((s) => [s.puuid, s]));

  const rows = players.flatMap((player): LeaderboardRow[] => {
    if (role !== "ALL") {
      const r = player.stats.roleStats.find((rs) => rs.position === role);
      if (!r || r.games === 0) return [];
      return [{ player, wins: r.wins, games: r.games, winrate: r.winrate }];
    }
    if (stack !== "all") {
      const s = stackMap.get(player.puuid);
      const fields = STACK_FIELDS[stack];
      const games = s ? (s[fields.games] as number) : 0;
      if (!s || games === 0) return [];
      const wins = s[fields.wins] as number;
      return [{ player, wins, games, winrate: (wins / games) * 100 }];
    }
    const { wins, totalGames, winrate } = player.stats;
    return [{ player, wins, games: totalGames, winrate }];
  });

  const overall = role === "ALL" && stack === "all";
  return rows.sort((a, b) =>
    overall ? b.player.totalLp - a.player.totalLp : b.winrate - a.winrate,
  );
}
