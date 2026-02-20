import { getDdragonVersion } from "./lib/service";
import {
  getAllRankedSnapshots,
  getAllPlayerStats,
  getLastMatchByPuuid,
  getLatestSyncedAt,
} from "./lib/db";
import {
  computeAverageElo,
  computeBestOfChallenge,
  lpToTier,
  EMPTY_STATS,
} from "./lib/helpers";
import { rankToLp } from "./data/constants";
import { users } from "./data/users";
import type {
  RankTier,
  Summoner,
  LeagueEntry,
  PlayerAggregatedStats,
  Match,
} from "./types/riot";
import ChallengeHeader from "./components/dashboard/ChallengeHeader";
import Leaderboard from "./components/dashboard/Leaderboard";
import PlayerCard from "./components/dashboard/PlayerCard";
import BestOfSection from "./components/dashboard/BestOfSection";
import RoleLeaderboard from "./components/dashboard/RoleLeaderboard";
import SyncTrigger from "./components/SyncTrigger";

// Revalidate every 15 minutes — unstable_cache prevents redundant DB reads
export const revalidate = 900;

export default async function Home() {
  const [snapshots, statsRows, lastMatches, version, syncedAt] =
    await Promise.all([
      getAllRankedSnapshots(),
      getAllPlayerStats(),
      Promise.all(users.map((u) => getLastMatchByPuuid(u.puuid))),
      getDdragonVersion(),
      getLatestSyncedAt(),
    ]);

  const snapshotMap = new Map(snapshots.map((s) => [s.puuid, s]));
  const statsMap = new Map(statsRows.map((r) => [r.puuid, r]));
  const lastMatchMap = new Map(
    users.map((u, i) => [u.puuid, lastMatches[i] as Match | null]),
  );
  const dbEmpty = snapshots.length === 0;

  // Build dashboard data from DB (0 Riot calls)
  const dashboardData = users.map((user) => {
    const snap = snapshotMap.get(user.puuid);
    const summoner: Summoner | null = snap?.summonerJson
      ? JSON.parse(snap.summonerJson)
      : null;
    const flexEntry: LeagueEntry | null = snap?.flexEntryJson
      ? JSON.parse(snap.flexEntryJson)
      : null;
    return {
      puuid: user.puuid,
      gameName: user.gameName,
      tagLine: user.tagLine,
      summoner,
      flexEntry,
      lastMatch: lastMatchMap.get(user.puuid) ?? null,
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

  const eligibleForBestOf = playerStatsData.filter(
    (p) => p.stats && (p.stats as PlayerAggregatedStats).totalGames > 0,
  ) as {
    gameName: string;
    stats: PlayerAggregatedStats;
    profileIconId: number | null;
  }[];

  const bestOf =
    eligibleForBestOf.length > 0
      ? computeBestOfChallenge(eligibleForBestOf)
      : null;

  const { avgLp, avgTierLabel } = computeAverageElo(
    dashboardData.map((p) => p.flexEntry),
  );

  const playerLpData = dashboardData.map((p) => {
    const totalLp = p.flexEntry
      ? rankToLp(p.flexEntry.tier, p.flexEntry.rank, p.flexEntry.leaguePoints)
      : 0;
    return {
      gameName: p.gameName,
      totalLp,
      tierLabel: p.flexEntry
        ? `${p.flexEntry.tier.charAt(0)}${p.flexEntry.tier.slice(1).toLowerCase()} ${p.flexEntry.rank}`
        : "Unranked",
      tier: (p.flexEntry?.tier ?? lpToTier(totalLp)) as RankTier,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Background sync trigger — fires after render, no blocking */}
      <SyncTrigger dbEmpty={dbEmpty} syncedAt={syncedAt} />

      <div className="space-y-8 stagger-children">
        {dbEmpty ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-semibold text-zinc-300">
              Syncing data for the first time…
            </p>
            <p className="text-sm text-zinc-500">
              This takes a few minutes on first load. The page will refresh
              automatically.
            </p>
          </div>
        ) : (
          <>
            <ChallengeHeader
              avgLp={avgLp}
              avgTierLabel={avgTierLabel}
              avgTier={lpToTier(avgLp) as RankTier}
              playerCount={dashboardData.length}
              players={playerLpData}
            />

            {bestOf && <BestOfSection best={bestOf} />}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-4">
                <Leaderboard players={dashboardData} version={version} />
                <RoleLeaderboard players={playerStatsData} version={version} />
              </div>
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Player Cards
                </h2>
                <div className="grid grid-cols-1 gap-3 stagger-grid">
                  {dashboardData.map((player) => (
                    <PlayerCard
                      key={player.puuid}
                      player={player}
                      version={version}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
