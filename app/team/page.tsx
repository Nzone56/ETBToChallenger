import { users } from "@/app/data/users";
import { getDdragonVersion } from "@/app/lib/service";
import {
  getAllRankedSnapshots,
  getAllPlayerStats,
  getGroupMatches,
  getLatestSyncedAt,
} from "@/app/lib/db";
import { EMPTY_STATS } from "@/app/lib/helpers";
import type { Summoner, PlayerAggregatedStats } from "@/app/types/riot";
import TeamOverview from "@/app/components/team/TeamOverview";
import InternalRankings from "@/app/components/team/InternalRankings";
import FinalRankings from "@/app/components/team/FinalRankings";
import GroupMatchHistory from "@/app/components/team/GroupMatchHistory";
import SyncTrigger from "@/app/components/SyncTrigger";

export const revalidate = 900;

export default async function TeamPage() {
  const [snapshots, statsRows, groupMatches, version, syncedAt] =
    await Promise.all([
      getAllRankedSnapshots(),
      getAllPlayerStats(),
      getGroupMatches(),
      getDdragonVersion(),
      getLatestSyncedAt(),
    ]);

  const snapshotMap = new Map(snapshots.map((s) => [s.puuid, s]));
  const statsMap = new Map(statsRows.map((r) => [r.puuid, r]));
  const dbEmpty = snapshots.length === 0;

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

  // Calculate group wins from precomputed slim group matches
  const groupWins = groupMatches.filter(({ match, players }) => {
    const firstPlayer = players[0];
    const p = match.info.participants.find(
      (pt) => pt.puuid === firstPlayer.puuid,
    );
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

        {/* Final Rankings — avg position across all stat categories */}
        <FinalRankings players={playerStatsData} version={version} />

        {/* Internal Rankings (client component for sorting) */}
        <InternalRankings players={playerStatsData} version={version} />

        {/* Group Match History */}
        <GroupMatchHistory groupMatches={groupMatches} />
      </div>
    </main>
  );
}
