import { RefreshCw } from "lucide-react";
import { getDdragonVersion } from "./lib/service";
import {
  getCirRoleAverages,
  getLastMatchByPuuid,
  getLatestSyncedAt,
  getLoneWolfStats,
  getPlayerStackStats,
} from "./lib/db";
import { summarizeLastGame } from "./lib/lastGame";
import { computeBestOfChallenge } from "./lib/ranking";
import { loadRoster } from "./lib/roster";
import { users } from "./data/users";
import type { Match } from "./types/riot";
import ChallengeHero from "./components/dashboard/ChallengeHero";
import BestOfSection from "./components/dashboard/BestOfSection";
import LoneWolf from "./components/dashboard/LoneWolf";
import RoleCirLeaderboard from "./components/dashboard/RoleCirLeaderboard";
import Standings from "./components/dashboard/Standings";
import EmptyState from "./components/ui/EmptyState";
import SyncTrigger from "./components/SyncTrigger";

// Rendered on request, never prerendered at build: building on Vercel ran the
// season-wide queries against a cold cache and hit Turso's "Resource
// exhausted" limit. Every read is in unstable_cache (15 min), so a request
// still costs no database work once warm.
export const dynamic = "force-dynamic";

export default async function Home() {
  const puuids = users.map((u) => u.puuid);
  const [roster, lastMatches, version, syncedAt] = await Promise.all([
    loadRoster(),
    Promise.all(puuids.map((id) => getLastMatchByPuuid(id) as Promise<Match | null>)),
    getDdragonVersion(),
    getLatestSyncedAt(),
  ]);
  // These read every season match. Run together on a cold cache they exceed
  // Turso's response memory ("Resource exhausted"), so they go one at a time.
  // Once cached (15 min) they cost nothing.
  const cirRoleAverages = await getCirRoleAverages(puuids);
  const loneWolfStats = await getLoneWolfStats(puuids);
  const stackStats = await getPlayerStackStats(puuids);

  const dbEmpty = roster.every((p) => !p.flexEntry && !p.hasStats);

  if (dbEmpty) {
    return (
      <>
        <SyncTrigger dbEmpty syncedAt={syncedAt} />
        <EmptyState
          size="full"
          icon={RefreshCw}
          title="Syncing for the first time…"
          description="Pulling every Flex game this season from Riot. This takes a few minutes; the page refreshes itself when it's done."
        />
      </>
    );
  }

  const lastGames = Object.fromEntries(puuids.map((id, i) => [id, summarizeLastGame(lastMatches[i], id)]));
  const iconMap = new Map(roster.map((p) => [p.puuid, p.profileIconId]));
  const playersWithGames = roster.filter((p) => p.stats.totalGames > 0);
  const bestOf = playersWithGames.length > 0 ? computeBestOfChallenge(playersWithGames) : null;

  // Read top to bottom the way you'd ask: where are we, who's where, who's
  // carrying each role, who's off playing alone, and the season superlatives.
  // Every row is full-width or an equal-height pair, so nothing leaves a hole.
  return (
    <div className="appear-children space-y-6">
      <SyncTrigger dbEmpty={false} syncedAt={syncedAt} />

      <ChallengeHero roster={roster} version={version} />

      <Standings players={roster} stackStats={stackStats} lastGames={lastGames} version={version} />

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <RoleCirLeaderboard
          entries={cirRoleAverages}
          players={roster.map((p) => ({ gameName: p.gameName, profileIconId: p.profileIconId }))}
          version={version}
        />
        <LoneWolf
          entries={loneWolfStats.map((e) => ({ ...e, profileIconId: iconMap.get(e.puuid) ?? null }))}
          version={version}
        />
      </div>

      {bestOf && <BestOfSection best={bestOf} />}
    </div>
  );
}
