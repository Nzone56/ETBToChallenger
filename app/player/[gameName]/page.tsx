import { getPlayerFullData, getDdragonVersion } from "@/app/lib/service";
import { getUserByRiotId } from "@/app/data/users";
import { aggregatePlayerStats } from "@/app/lib/helpers";
import { notFound } from "next/navigation";
import PlayerHeader from "@/app/components/player/PlayerHeader";
import AggregatedStats from "@/app/components/player/AggregatedStats";
import RolePerformance from "@/app/components/player/RolePerformance";
import ChampionStatsTable from "@/app/components/player/ChampionStatsTable";
import MatchHistoryList from "@/app/components/player/MatchHistoryList";

export const revalidate = 120;

interface PlayerPageProps {
  params: Promise<{
    gameName: string;
  }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { gameName } = await params;
  const decodedGameName = decodeURIComponent(gameName);

  const user = getUserByRiotId(decodedGameName, "ETB");
  if (!user) {
    notFound();
  }

  const [{ ranked, matches }, version] = await Promise.all([
    getPlayerFullData(user.puuid, user.gameName, user.tagLine),
    getDdragonVersion(),
  ]);

  const stats = aggregatePlayerStats(user.puuid, matches);
  const initialDisplayMatches = matches.slice(0, 10);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6 stagger-children">
        {/* Header: Name, Rank, LP, Winrate */}
        <PlayerHeader player={ranked} version={version} />

        {/* Aggregated Stats: KDA, CS/min, Damage, Vision */}
        <AggregatedStats stats={stats} />

        {/* Role Performance */}
        <RolePerformance roleStats={stats.roleStats} />

        {/* Champion Stats Table */}
        <ChampionStatsTable champions={stats.championStats} version={version} />

        {/* Match History with Load More */}
        <MatchHistoryList
          puuid={user.puuid}
          initialMatches={initialDisplayMatches}
          version={version}
          pageSize={10}
        />
      </div>
    </main>
  );
}
