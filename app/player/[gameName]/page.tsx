import { getDdragonVersion } from "@/app/lib/service";
import {
  getRankedSnapshot,
  getPlayerStats,
  getMatchesByPuuidPaged,
} from "@/app/lib/db";
import { getUserByRiotId } from "@/app/data/users";
import { notFound } from "next/navigation";
import PlayerHero from "@/app/components/player/PlayerHero";
import PlayerStatsGrid from "@/app/components/player/PlayerStatsGrid";
import RoleSpecialization from "@/app/components/player/RoleSpecialization";
import ChampionProficiency from "@/app/components/player/ChampionProficiency";
import PlayerRadarChart from "@/app/components/player/PlayerRadarChart";
import MatchHistoryList from "@/app/components/player/MatchHistoryList";
import SyncTrigger from "@/app/components/SyncTrigger";
import { getChampionSkinUrl } from "@/app/lib/skinUtils";
import type {
  Summoner,
  LeagueEntry,
  PlayerAggregatedStats,
  PlayerRankedData,
  Match,
} from "@/app/types/riot";

export const revalidate = 900;

interface PlayerPageProps {
  params: Promise<{ gameName: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { gameName } = await params;
  const decodedGameName = decodeURIComponent(gameName);

  const user = getUserByRiotId(decodedGameName, "ETB");
  if (!user) notFound();

  const [snap, statsRow, matches, version] = await Promise.all([
    getRankedSnapshot(user.puuid),
    getPlayerStats(user.puuid),
    getMatchesByPuuidPaged(user.puuid, 10),
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
  const typedMatches = matches as unknown as Match[];

  const ranked: PlayerRankedData = {
    puuid: user.puuid,
    gameName: user.gameName,
    tagLine: user.tagLine,
    summoner,
    flexEntry,
  };

  // Fetch skin URL for most played champion (fire-and-forget, won't block render)
  const mostPlayedChamp = stats?.championStats?.[0]?.championName ?? null;
  const skinUrl = mostPlayedChamp
    ? await getChampionSkinUrl(mostPlayedChamp, version)
    : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <SyncTrigger dbEmpty={dbEmpty} />

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
        <div className="space-y-6 stagger-children">
          {/* Hero banner with skin background */}
          <PlayerHero
            player={ranked}
            stats={stats}
            version={version}
            skinUrl={skinUrl}
          />

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-1">
              <RoleSpecialization roleStats={stats.roleStats} />
              <PlayerRadarChart stats={stats} />
            </div>

            {/* Right column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Top stat cards row */}
              <PlayerStatsGrid stats={stats} />

              {/* Champion proficiency */}
              <ChampionProficiency
                champions={stats.championStats}
                version={version}
              />
            </div>
          </div>

          {/* Match history — full width */}
          <MatchHistoryList
            puuid={user.puuid}
            initialMatches={typedMatches}
            version={version}
            pageSize={10}
            totalGames={stats.totalGames}
          />
        </div>
      )}
    </main>
  );
}
