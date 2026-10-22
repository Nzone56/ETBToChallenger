import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { getDdragonVersion } from "@/app/lib/service";
import { getMatchesByPuuidPaged } from "@/app/lib/db";
import { loadRoster } from "@/app/lib/roster";
import { getChampionSkinUrl } from "@/app/lib/skinUtils";
import { getUserByRiotId, users } from "@/app/data/users";
import type { Match } from "@/app/types/riot";
import PlayerHero from "@/app/components/player/PlayerHero";
import PlayerStatsGrid from "@/app/components/player/PlayerStatsGrid";
import RoleSpecialization from "@/app/components/player/RoleSpecialization";
import ChampionProficiency from "@/app/components/player/ChampionProficiency";
import PlayerRadarChart from "@/app/components/player/PlayerRadarChart";
import MatchHistoryList from "@/app/components/player/MatchHistoryList";
import EmptyState from "@/app/components/ui/EmptyState";
import SyncTrigger from "@/app/components/SyncTrigger";

export const revalidate = 900;

interface PlayerPageProps {
  params: Promise<{ gameName: string }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { gameName } = await params;
  return { title: decodeURIComponent(gameName) };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { gameName } = await params;
  const user = getUserByRiotId(decodeURIComponent(gameName), "ETB");
  if (!user) notFound();

  const [roster, matches, version] = await Promise.all([
    loadRoster(),
    getMatchesByPuuidPaged(user.puuid, 10) as Promise<Match[]>,
    getDdragonVersion(),
  ]);
  const player = roster.find((p) => p.puuid === user.puuid)!;

  if (!player.hasStats) {
    return (
      <>
        <SyncTrigger dbEmpty />
        <EmptyState
          size="full"
          icon={RefreshCw}
          title={`Syncing ${user.gameName}…`}
          description="This takes a moment the first time. The page refreshes itself when it's done."
        />
      </>
    );
  }

  const { stats } = player;
  const champions = [...stats.championStats].sort((a, b) => b.games - a.games);
  const mainChampion = champions[0]?.championName ?? null;
  const skinUrl = mainChampion ? await getChampionSkinUrl(mainChampion, version) : null;

  return (
    <div className="appear-children space-y-6">
      <SyncTrigger dbEmpty={false} />

      <PlayerHero player={player} version={version} skinUrl={skinUrl} mainChampion={mainChampion} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <RoleSpecialization roleStats={stats.roleStats} />
          <PlayerRadarChart stats={stats} />
        </div>
        <div className="space-y-6 xl:col-span-2">
          <PlayerStatsGrid stats={stats} />
          <ChampionProficiency champions={stats.championStats} version={version} />
        </div>
      </div>

      <MatchHistoryList
        puuid={user.puuid}
        initialMatches={matches}
        version={version}
        pageSize={10}
        totalGames={stats.totalGames}
        champions={champions.map((c) => c.championName)}
        companions={users
          .filter((u) => u.puuid !== user.puuid)
          .map((u) => ({ puuid: u.puuid, gameName: u.gameName }))}
      />
    </div>
  );
}
