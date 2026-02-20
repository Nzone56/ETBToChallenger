import { users } from "@/app/data/users";
import { getDdragonVersion } from "@/app/lib/service";
import {
  getAllRankedSnapshots,
  getAllPlayerStats,
  getMatchesByPuuid,
  getLatestSyncedAt,
} from "@/app/lib/db";
import {
  findGroupMatches,
  getParticipant,
  EMPTY_STATS,
} from "@/app/lib/helpers";
import type { Summoner, PlayerAggregatedStats, Match } from "@/app/types/riot";
import TeamOverview from "@/app/components/team/TeamOverview";
import InternalRankings from "@/app/components/team/InternalRankings";
import GroupMatchHistory from "@/app/components/team/GroupMatchHistory";
import SyncTrigger from "@/app/components/SyncTrigger";

export const revalidate = 120;

export default async function TeamPage() {
  const [snapshots, statsRows, version] = await Promise.all([
    Promise.resolve(getAllRankedSnapshots()),
    Promise.resolve(getAllPlayerStats()),
    getDdragonVersion(),
  ]);
  const syncedAt = getLatestSyncedAt();

  const snapshotMap = new Map(snapshots.map((s) => [s.puuid, s]));
  const statsMap = new Map(statsRows.map((r) => [r.puuid, r]));
  const dbEmpty = snapshots.length === 0;

  // Build per-player data from DB (0 Riot calls)
  const allPlayerMatches = users.map((user) => {
    const snap = snapshotMap.get(user.puuid);
    const summoner: Summoner | null = snap?.summonerJson
      ? JSON.parse(snap.summonerJson)
      : null;
    const matches = getMatchesByPuuid(user.puuid) as Match[];
    return {
      puuid: user.puuid,
      gameName: user.gameName,
      matches,
      profileIconId: summoner?.profileIconId ?? null,
    };
  });

  const playerStatsData = users.map((user) => {
    const snap = snapshotMap.get(user.puuid);
    const statsRow = statsMap.get(user.puuid);
    const summoner: Summoner | null = snap?.summonerJson
      ? JSON.parse(snap.summonerJson)
      : null;
    const stats: PlayerAggregatedStats | null = statsRow?.statsJson
      ? JSON.parse(statsRow.statsJson)
      : null;
    return {
      gameName: user.gameName,
      profileIconId: summoner?.profileIconId ?? null,
      stats: stats ?? EMPTY_STATS,
    };
  });

  // Find group matches (2+ members played together)
  const groupMatches = findGroupMatches(allPlayerMatches);

  // Calculate group wins
  const groupWins = groupMatches.filter(({ match, players }) => {
    const firstPlayer = players[0];
    const p = getParticipant(match, firstPlayer.puuid);
    return p?.win;
  }).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SyncTrigger dbEmpty={dbEmpty} syncedAt={syncedAt} />
      <div className="space-y-8 stagger-children">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Team Analytics
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Stack performance, internal rankings, and group match history
          </p>
        </div>

        {/* Team Overview Stats */}
        <TeamOverview
          players={playerStatsData}
          totalGroupMatches={groupMatches.length}
          groupWins={groupWins}
          version={version}
        />

        {/* Internal Rankings (client component for sorting) */}
        <InternalRankings players={playerStatsData} version={version} />

        {/* Group Match History */}
        <GroupMatchHistory groupMatches={groupMatches} />
      </div>
    </main>
  );
}
