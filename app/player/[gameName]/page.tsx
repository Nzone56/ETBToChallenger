import { getDdragonVersion } from "@/app/lib/service";
import {
  getRankedSnapshot,
  getPlayerStats,
  getMatchesByPuuid,
} from "@/app/lib/db";
import { getUserByRiotId } from "@/app/data/users";
import { notFound } from "next/navigation";
import PlayerHeader from "@/app/components/player/PlayerHeader";
import AggregatedStats from "@/app/components/player/AggregatedStats";
import RolePerformance from "@/app/components/player/RolePerformance";
import ChampionStatsTable from "@/app/components/player/ChampionStatsTable";
import MatchHistoryList from "@/app/components/player/MatchHistoryList";
import SyncTrigger from "@/app/components/SyncTrigger";
import type {
  Summoner,
  LeagueEntry,
  PlayerAggregatedStats,
  PlayerRankedData,
  Match,
} from "@/app/types/riot";

export const revalidate = 120;

interface PlayerPageProps {
  params: Promise<{ gameName: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { gameName } = await params;
  const decodedGameName = decodeURIComponent(gameName);

  const user = getUserByRiotId(decodedGameName, "ETB");
  if (!user) notFound();

  const [snap, statsRow, version] = await Promise.all([
    Promise.resolve(getRankedSnapshot(user.puuid)),
    Promise.resolve(getPlayerStats(user.puuid)),
    getDdragonVersion(),
  ]);

  const dbEmpty = !snap;

  const summoner: Summoner | null = snap?.summonerJson
    ? JSON.parse(snap.summonerJson)
    : null;
  const flexEntry: LeagueEntry | null = snap?.flexEntryJson
    ? JSON.parse(snap.flexEntryJson)
    : null;
  const stats = statsRow as PlayerAggregatedStats | null;
  const matches = getMatchesByPuuid(user.puuid) as Match[];

  const ranked: PlayerRankedData = {
    puuid: user.puuid,
    gameName: user.gameName,
    tagLine: user.tagLine,
    summoner,
    flexEntry,
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SyncTrigger dbEmpty={dbEmpty} />
      <div className="space-y-6 stagger-children">
        {dbEmpty || !stats ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-semibold text-zinc-300">
              Syncing data for {user.gameName}…
            </p>
            <p className="text-sm text-zinc-500">
              This takes a moment on first load. The page will refresh
              automatically.
            </p>
          </div>
        ) : (
          <>
            <PlayerHeader player={ranked} version={version} />
            <AggregatedStats stats={stats} />
            <RolePerformance roleStats={stats.roleStats} />
            <ChampionStatsTable
              champions={stats.championStats}
              version={version}
            />
            <MatchHistoryList
              puuid={user.puuid}
              initialMatches={matches.slice(0, 10)}
              version={version}
              pageSize={10}
            />
          </>
        )}
      </div>
    </main>
  );
}
