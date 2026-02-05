import {
  getDashboardData,
  getDdragonVersion,
  getAllSeasonMatches,
} from "./lib/service";
import { logApiSummary } from "./lib/client";
import {
  computeAverageElo,
  computeBestOfChallenge,
  aggregatePlayerStats,
  lpToTier,
} from "./lib/helpers";
import { rankToLp, QUEUE_FLEX } from "./data/constants";
import { RankTier } from "./types/riot";
import ChallengeHeader from "./components/dashboard/ChallengeHeader";
import Leaderboard from "./components/dashboard/Leaderboard";
import PlayerCard from "./components/dashboard/PlayerCard";
import BestOfSection from "./components/dashboard/BestOfSection";
import RoleLeaderboard from "./components/dashboard/RoleLeaderboard";

export const revalidate = 120;

export default async function Home() {
  const [dashboardData, version] = await Promise.all([
    getDashboardData(),
    getDdragonVersion(),
  ]);

  // Compute average Elo
  const { avgLp, avgTierLabel } = computeAverageElo(
    dashboardData.map((p) => p.flexEntry),
  );

  // Per-player LP data for expandable progress bars
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

  // Fetch ALL season flex matches for "Best of" calculations
  const playerStatsData = await Promise.all(
    dashboardData.map(async (player) => {
      try {
        const matches = await getAllSeasonMatches(player.puuid, QUEUE_FLEX);
        const stats = aggregatePlayerStats(player.puuid, matches);
        return {
          gameName: player.gameName,
          profileIconId: player.summoner?.profileIconId ?? null,
          stats,
        };
      } catch {
        return {
          gameName: player.gameName,
          profileIconId: player.summoner?.profileIconId ?? null,
          stats: aggregatePlayerStats(player.puuid, []),
        };
      }
    }),
  );

  const bestOf = computeBestOfChallenge(playerStatsData);

  logApiSummary();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8 stagger-children">
        {/* Challenge Title & Global Progress */}
        <ChallengeHeader
          avgLp={avgLp}
          avgTierLabel={avgTierLabel}
          avgTier={lpToTier(avgLp) as RankTier}
          playerCount={dashboardData.length}
          players={playerLpData}
        />

        {/* Best of the Challenge */}
        <BestOfSection best={bestOf} />

        {/* Main grid: Leaderboards + Player Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Leaderboards */}
          <div className="lg:col-span-1 space-y-4">
            <Leaderboard players={dashboardData} version={version} />
            <RoleLeaderboard players={playerStatsData} version={version} />
          </div>

          {/* Player Cards */}
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
      </div>
    </main>
  );
}
