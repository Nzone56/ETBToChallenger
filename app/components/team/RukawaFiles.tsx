"use client";

import { RukawaAnalytics } from "@/app/lib/rukawaAnalytics";
import {
  FileWarning,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface RukawaFilesProps {
  analytics: RukawaAnalytics;
}

export default function RukawaFiles({ analytics }: RukawaFilesProps) {
  // Sort synergy matrix by WR descending
  const sortedSynergy = [...analytics.synergyMatrix].sort(
    (a, b) => b.winrateWithRukawa - a.winrateWithRukawa,
  );
  const bestSynergy = sortedSynergy[0];
  const worstSynergy = sortedSynergy[sortedSynergy.length - 1];

  // Find biggest tax victim
  const sortedTax = [...analytics.rukawaTax].sort(
    (a, b) => b.cirDrain - a.cirDrain,
  );
  const biggestTax = sortedTax[0];

  // Find biggest WR drain victim
  const sortedWrImpact = [...analytics.winrateImpact].sort(
    (a, b) => b.wrDrain - a.wrDrain,
  );
  const biggestWrDrain = sortedWrImpact[0];

  // Find best and worst role
  const sortedRoles = [...analytics.rolePerformance].sort(
    (a, b) => b.avgCir - a.avgCir,
  );

  // Filter stack5 to only show 5-player lineups
  const stack5Only = analytics.stack5Combos.filter(
    (combo) => combo.players.length === 5,
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border-2 border-orange-500/50 bg-zinc-950 p-6">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(251,146,60,0.05)_10px,rgba(251,146,60,0.05)_20px)]" />
        <div className="relative flex items-center gap-4">
          <FileWarning className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-orange-500">
              ⚠️ CLASSIFIED: THE RUKAWA FILES ⚠️
            </h1>
            <p className="text-sm text-orange-400/80">
              [TOP SECRET] Deep Analytics Investigation Report
            </p>
          </div>
        </div>
      </div>

      {/* Synergy Matrix */}
      <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-orange-400">
          <Users className="h-5 w-5" />
          Synergy Matrix - Partner Win Rates
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sortedSynergy.map((synergy) => {
            const isBest = synergy.puuid === bestSynergy?.puuid;
            const isWorst = synergy.puuid === worstSynergy?.puuid;
            const wr = synergy.winrateWithRukawa;

            return (
              <div
                key={synergy.puuid}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 p-3 transition-all hover:scale-105",
                  isBest &&
                    "border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20",
                  isWorst &&
                    "animate-pulse border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20",
                  !isBest && !isWorst && "border-zinc-700 bg-zinc-900/50",
                  wr === 0 && "hover:animate-[glitch_0.3s_ease-in-out]",
                )}
              >
                {isBest && (
                  <div className="absolute right-1 top-1 text-xs font-bold text-yellow-500">
                    👑 CAREGIVER
                  </div>
                )}
                {isWorst && (
                  <div className="absolute right-1 top-1 text-xs font-bold text-red-500">
                    🕳️ BLACK HOLE
                  </div>
                )}

                <div className="text-sm font-semibold text-zinc-200 truncate">
                  {synergy.teammate}
                </div>
                <div
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    wr >= 60
                      ? "text-emerald-400"
                      : wr >= 50
                        ? "text-zinc-300"
                        : wr > 0
                          ? "text-red-400"
                          : "text-red-600",
                  )}
                >
                  {wr.toFixed(0)}%
                </div>
                <div className="text-xs text-zinc-500">
                  {synergy.gamesWithRukawa}G
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WR Impact Drain */}
      <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-orange-400">
          <TrendingDown className="h-5 w-5" />
          Winrate Impact - The Rukawa Curse
        </h2>

        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-400">Most Affected</div>
              <div className="text-xl font-bold text-red-300">
                {biggestWrDrain?.teammate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-500">WR Drain</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-400">
                  {biggestWrDrain?.wrDrain.toFixed(1)}%
                </div>
                <div className="text-2xl">�</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {sortedWrImpact.slice(0, 6).map((impact) => (
            <div
              key={impact.puuid}
              className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3"
            >
              <span className="font-semibold text-zinc-200">
                {impact.teammate}
              </span>
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Without</div>
                    <div className="font-bold text-emerald-400">
                      {impact.wrWithoutRukawa.toFixed(1)}%
                    </div>
                    <div className="text-xs text-zinc-600">
                      {impact.gamesWithoutRukawa}G
                    </div>
                  </div>
                  <div className="text-orange-500">→</div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">With</div>
                    <div className="font-bold text-red-400">
                      {impact.wrWithRukawa.toFixed(1)}%
                    </div>
                    <div className="text-xs text-zinc-600">
                      {impact.gamesWithRukawa}G
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 text-right font-bold sm:min-w-15",
                    impact.wrDrain > 0 ? "text-red-400" : "text-emerald-400",
                  )}
                >
                  {impact.wrDrain > 0 ? "-" : "+"}
                  {Math.abs(impact.wrDrain).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rukawa Tax (CIR) */}
      <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-orange-400">
          <TrendingDown className="h-5 w-5" />
          The Rukawa Tax - CIR Impact Drain
        </h2>

        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-950/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-400">Biggest Victim</div>
              <div className="text-xl font-bold text-red-300">
                {biggestTax?.teammate}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-500">CIR Drain</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-400">
                  -{biggestTax?.cirDrain.toFixed(1)}
                </div>
                <div className="relative h-8 w-8">
                  <div className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
                  <div className="relative flex h-full items-center justify-center text-2xl">
                    💧
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {sortedTax.slice(0, 6).map((tax) => (
            <div
              key={tax.puuid}
              className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3"
            >
              <span className="font-semibold text-zinc-200">
                {tax.teammate}
              </span>
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Without</div>
                    <div className="font-bold text-emerald-400">
                      {tax.avgCirWithoutRukawa.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-orange-500">→</div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">With</div>
                    <div className="font-bold text-red-400">
                      {tax.avgCirWithRukawa.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 text-right font-bold sm:min-w-15",
                    tax.cirDrain > 0 ? "text-red-400" : "text-emerald-400",
                  )}
                >
                  {tax.cirDrain > 0 ? "-" : "+"}
                  {Math.abs(tax.cirDrain).toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Miracle Lineups */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stack-3 */}
        <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
          <h2 className="mb-4 text-lg font-bold uppercase text-orange-400">
            Trio Lineups - All Combinations
          </h2>

          <div className="space-y-2">
            {analytics.stack3Combos.map((combo, i) => {
              const wr = combo.winrate;
              const getWrColor = () => {
                if (wr >= 60)
                  return {
                    border: "border-emerald-600/60",
                    bg: "bg-emerald-950/30",
                    text: "text-emerald-400",
                  };
                if (wr >= 50)
                  return {
                    border: "border-yellow-600/50",
                    bg: "bg-yellow-950/20",
                    text: "text-yellow-400",
                  };
                if (wr >= 40)
                  return {
                    border: "border-orange-600/50",
                    bg: "bg-orange-950/20",
                    text: "text-orange-400",
                  };
                return {
                  border: "border-red-600/60",
                  bg: "bg-red-950/30",
                  text: "text-red-400",
                };
              };
              const colors = getWrColor();

              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3",
                    colors.border,
                    colors.bg,
                  )}
                >
                  <div className="mb-2">
                    <div className="mb-1 text-xs text-zinc-400 leading-tight">
                      {combo.players.join(" + ")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className={cn("text-lg font-bold", colors.text)}>
                      {combo.winrate.toFixed(0)}% WR
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-zinc-500">{combo.games}G</span>
                      <span className="text-zinc-600">•</span>
                      {combo.avgCirDifference > 0 ? (
                        <div
                          className="flex items-center gap-1"
                          title="Teammates carried Rukawa"
                        >
                          <span className="text-emerald-400">
                            👍 Team carried
                          </span>
                          <span className="font-bold text-emerald-400">
                            +{combo.avgCirDifference.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1"
                          title="Rukawa carried teammates"
                        >
                          <span className="text-violet-400">
                            🎯 Rukawa carried
                          </span>
                          <span className="font-bold text-violet-400">
                            {combo.avgCirDifference.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stack-5 */}
        <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
          <h2 className="mb-4 text-lg font-bold uppercase text-orange-400">
            Full Team Lineups (5-Stack Only)
          </h2>

          <div className="space-y-2">
            {stack5Only.map((combo, i) => {
              const wr = combo.winrate;
              const getWrColor = () => {
                if (wr >= 60)
                  return {
                    border: "border-emerald-600/60",
                    bg: "bg-emerald-950/30",
                    text: "text-emerald-400",
                  };
                if (wr >= 50)
                  return {
                    border: "border-yellow-600/50",
                    bg: "bg-yellow-950/20",
                    text: "text-yellow-400",
                  };
                if (wr >= 40)
                  return {
                    border: "border-orange-600/50",
                    bg: "bg-orange-950/20",
                    text: "text-orange-400",
                  };
                return {
                  border: "border-red-600/60",
                  bg: "bg-red-950/30",
                  text: "text-red-400",
                };
              };
              const colors = getWrColor();

              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3",
                    colors.border,
                    colors.bg,
                  )}
                >
                  <div className="mb-2">
                    <div className="mb-1 text-xs text-zinc-400 leading-tight">
                      {combo.players.join(", ")}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className={cn("text-lg font-bold", colors.text)}>
                      {combo.winrate.toFixed(0)}% WR
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-zinc-500">{combo.games}G</span>
                      <span className="text-zinc-600">•</span>
                      {combo.avgCirDifference > 0 ? (
                        <div
                          className="flex items-center gap-1"
                          title="Teammates carried Rukawa"
                        >
                          <span className="text-emerald-400">
                            👍 Team carried
                          </span>
                          <span className="font-bold text-emerald-400">
                            +{combo.avgCirDifference.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1"
                          title="Rukawa carried teammates"
                        >
                          <span className="text-violet-400">
                            🎯 Rukawa carried
                          </span>
                          <span className="font-bold text-violet-400">
                            {combo.avgCirDifference.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role Impact & Bronze Wall */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role Impact */}
        <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-orange-400">
            <Target className="h-5 w-5" />
            Role Impact Analysis
          </h2>

          <div className="space-y-2">
            {sortedRoles.map((role, i) => {
              const isBest = i === 0;
              const isWorst = i === sortedRoles.length - 1;

              return (
                <div
                  key={role.role}
                  className={cn(
                    "rounded-lg border p-3",
                    isBest && "border-emerald-500/50 bg-emerald-950/20",
                    isWorst && "border-red-500/50 bg-red-950/20",
                    !isBest && !isWorst && "border-zinc-700 bg-zinc-900/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-200">
                        {role.role}
                        {isBest && (
                          <span className="ml-2 text-xs text-emerald-400">
                            ✨ Pure Luck
                          </span>
                        )}
                        {isWorst && (
                          <span className="ml-2 text-xs text-red-400">
                            💔 Emotional Damage
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">{role.games}G</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-xl font-bold",
                          isBest
                            ? "text-emerald-400"
                            : isWorst
                              ? "text-red-400"
                              : "text-zinc-300",
                        )}
                      >
                        {role.avgCir.toFixed(1)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {role.winrate.toFixed(0)}% WR
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bronze Wall */}
        <div className="rounded-xl border-2 border-orange-500/30 bg-zinc-950 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            The Bronze Wall
          </h2>

          <div className="mb-4 text-center">
            <div className="text-sm text-zinc-400">
              LP Donated to Enemy Team
            </div>
            <div className="text-6xl font-bold text-red-500">
              {analytics.lpDonated}
            </div>
            <div className="text-sm text-zinc-500">League Points</div>
          </div>

          <div className="relative h-8 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-linear-to-r from-red-600 to-red-400 transition-all"
              style={{
                width: `${Math.min((analytics.lpDonated / 1000) * 100, 100)}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {analytics.lpDonated >= 1000
                ? "MAXIMUM DONATION ACHIEVED"
                : "Building the wall..."}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-orange-500/50 bg-orange-950/20 p-3">
            <div className="text-sm text-orange-400">
              🎯 Who&apos;s to Blame?
            </div>
            <div className="mt-2 text-xs text-zinc-400">
              Matches where Rukawa had the lowest CIR of all 10 players
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-bold text-orange-500">
                {analytics.lowestCirMatches.length}
              </div>
              <div className="text-sm text-zinc-500">
                / {analytics.totalSeasonGames} games (
                {(
                  (analytics.lowestCirMatches.length /
                    analytics.totalSeasonGames) *
                  100
                ).toFixed(1)}
                %)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
