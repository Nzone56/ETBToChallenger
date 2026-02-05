import { users } from "@/app/data/users";
import {
  getAllSeasonMatches,
  getDdragonVersion,
  getSummoner,
} from "@/app/lib/service";
import {
  aggregatePlayerStats,
  findGroupMatches,
  getParticipant,
} from "@/app/lib/helpers";
import { QUEUE_FLEX } from "@/app/data/constants";
import TeamOverview from "@/app/components/team/TeamOverview";
import InternalRankings from "@/app/components/team/InternalRankings";
import GroupMatchHistory from "@/app/components/team/GroupMatchHistory";

export const revalidate = 120;

export default async function TeamPage() {
  const version = await getDdragonVersion();

  // Fetch ALL season flex matches + summoner data for all players
  const allPlayerMatches = await Promise.all(
    users.map(async (user) => {
      try {
        const [matches, summoner] = await Promise.all([
          getAllSeasonMatches(user.puuid, QUEUE_FLEX),
          getSummoner(user.puuid).catch(() => null),
        ]);
        return {
          puuid: user.puuid,
          gameName: user.gameName,
          matches,
          profileIconId: summoner?.profileIconId ?? null,
        };
      } catch {
        return {
          puuid: user.puuid,
          gameName: user.gameName,
          matches: [],
          profileIconId: null,
        };
      }
    }),
  );

  // Aggregate stats per player
  const playerStatsData = allPlayerMatches.map(
    ({ puuid, gameName, matches, profileIconId }) => ({
      gameName,
      profileIconId,
      stats: aggregatePlayerStats(puuid, matches),
    }),
  );

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
