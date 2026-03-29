import { PlayerRankedData, PlayerAggregatedStats } from "@/app/types/riot";
import RankBadge from "@/app/components/ui/RankBadge";
import WinrateBar from "@/app/components/ui/WinrateBar";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cirLabel } from "@/app/components/records/RecordData";
import { formatWinrate } from "@/app/lib/helpers";

interface PlayerHeroProps {
  player: PlayerRankedData;
  stats: PlayerAggregatedStats;
  version: string;
  skinUrl: string | null;
}

const ROLE_ICONS: Record<string, string> = {
  TOP: "🛡️",
  JUNGLE: "🌿",
  MIDDLE: "⚡",
  BOTTOM: "🎯",
  UTILITY: "💎",
};

export default function PlayerHero({
  player,
  stats,
  version,
  skinUrl,
}: PlayerHeroProps) {
  const wins = player.flexEntry?.wins ?? 0;
  const losses = player.flexEntry?.losses ?? 0;
  const totalGames = wins + losses;
  const primaryRole = stats.primaryRole;
  const { label: cirTier, color: cirColor } = cirLabel(stats.avgCir);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
      {/* Skin background */}
      {skinUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={skinUrl}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-linear-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/40" />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950/90 via-transparent to-zinc-950/30" />
        </div>
      )}
      {!skinUrl && (
        <div className="absolute inset-0 z-0 bg-linear-to-br from-zinc-900 to-zinc-950" />
      )}

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <Link
          href="/"
          className="mb-4 sm:mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          {/* Left: identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <ProfileIcon
                iconId={player.summoner?.profileIconId}
                version={version}
                size={64}
                className="ring-2 ring-teal-500/40 shadow-lg shadow-teal-900/20 sm:w-20 sm:h-20"
              />
              {primaryRole && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-xs">
                  {ROLE_ICONS[primaryRole] ?? "?"}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl drop-shadow-lg truncate">
                {player.gameName}
                <span className="ml-1 sm:ml-2 text-sm sm:text-base font-normal text-zinc-400">
                  #{player.tagLine}
                </span>
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <RankBadge
                  entry={player.flexEntry}
                  size="lg"
                  showLp
                  showWinrate
                />
              </div>
            </div>
          </div>

          {/* Right: quick stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:flex lg:shrink-0 lg:flex-wrap">
            {/* Win rate pill */}
            {totalGames > 0 && (
              <div className="rounded-lg sm:rounded-xl border border-zinc-700/60 bg-zinc-900/70 px-2 sm:px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Win Rate
                </p>
                <p
                  className={`text-base sm:text-lg font-bold tabular-nums ${wins / totalGames >= 0.5 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {formatWinrate((wins / totalGames) * 100)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-zinc-600">
                  {wins}W · {losses}L
                </p>
              </div>
            )}

            {/* CIR pill */}
            {stats.avgCir > 0 && (
              <div className="rounded-lg sm:rounded-xl border border-zinc-700/60 bg-zinc-900/70 px-2 sm:px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Avg CIR
                </p>
                <p
                  className={`text-base sm:text-lg font-bold tabular-nums ${cirColor}`}
                >
                  {stats.avgCir.toFixed(1)}
                </p>
                <p
                  className={`text-[9px] sm:text-[10px] ${cirColor} opacity-70`}
                >
                  {cirTier}
                </p>
              </div>
            )}

            {/* KDA pill */}
            <div className="rounded-lg sm:rounded-xl border border-zinc-700/60 bg-zinc-900/70 px-2 sm:px-4 py-2 text-center backdrop-blur-sm">
              <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                KDA
              </p>
              <p className="text-base sm:text-lg font-bold tabular-nums text-zinc-100">
                {stats.avgKda.toFixed(2)}
              </p>
              <p className="text-[9px] sm:text-[10px] text-zinc-600">
                {stats.avgKills.toFixed(1)}/{stats.avgDeaths.toFixed(1)}/
                {stats.avgAssists.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Winrate bar */}
        {player.flexEntry && (
          <div className="mt-4 max-w-full sm:max-w-xs">
            <WinrateBar wins={wins} losses={losses} />
          </div>
        )}
      </div>
    </div>
  );
}
