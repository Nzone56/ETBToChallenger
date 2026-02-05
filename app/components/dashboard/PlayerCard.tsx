import Link from "next/link";
import { PlayerDashboardData } from "@/app/types/riot";
import {
  getParticipant,
  calcKda,
  formatKda,
  formatWinrate,
} from "@/app/lib/helpers";
import { POSITION_LABELS, rankToLp } from "@/app/data/constants";
import RankBadge from "@/app/components/ui/RankBadge";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import WinrateBar from "@/app/components/ui/WinrateBar";
import { cn } from "@/app/lib/utils";
import { ChevronRight } from "lucide-react";

interface PlayerCardProps {
  player: PlayerDashboardData;
  version: string;
}

export default function PlayerCard({ player, version }: PlayerCardProps) {
  const lastMatchParticipant = player.lastMatch
    ? getParticipant(player.lastMatch, player.puuid)
    : null;

  const total = player.flexEntry
    ? player.flexEntry.wins + player.flexEntry.losses
    : 0;
  const winrate = player.flexEntry ? (player.flexEntry.wins / total) * 100 : 0;
  const lp = player.flexEntry
    ? rankToLp(
        player.flexEntry.tier,
        player.flexEntry.rank,
        player.flexEntry.leaguePoints,
      )
    : 0;

  return (
    <Link
      href={`/player/${encodeURIComponent(player.gameName)}`}
      className="group block"
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm transition-all hover:border-zinc-600 hover:bg-zinc-900/80">
        {/* Header row: icon + name + rank + stats */}
        <div className="flex items-center gap-3">
          <ProfileIcon
            iconId={player.summoner?.profileIconId}
            version={version}
            size={48}
            className="ring-2 ring-zinc-700/50"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-100 group-hover:text-white truncate">
                {player.gameName}
              </h3>
              <span className="text-xs text-zinc-600">#{player.tagLine}</span>
              <ChevronRight className="ml-auto h-4 w-4 text-zinc-700 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <RankBadge entry={player.flexEntry} size="sm" />
              {player.flexEntry && (
                <span className="text-xs text-zinc-500">{lp} LP</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        {player.flexEntry && (
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <WinrateBar
                wins={player.flexEntry.wins}
                losses={player.flexEntry.losses}
              />
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-zinc-200">
                {formatWinrate(winrate)}
              </div>
              <div className="text-xs text-zinc-500">
                {player.flexEntry.wins}W {player.flexEntry.losses}L
              </div>
            </div>
          </div>
        )}

        {/* Last Match */}
        {lastMatchParticipant && player.lastMatch && (
          <div
            className={cn(
              "mt-3 flex items-center gap-3 rounded-lg border px-3 py-2",
              lastMatchParticipant.win
                ? "border-emerald-800/50 bg-emerald-950/20"
                : "border-red-800/50 bg-red-950/20",
            )}
          >
            <ChampionIcon
              championName={lastMatchParticipant.championName}
              version={version}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-bold",
                    lastMatchParticipant.win
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {lastMatchParticipant.win ? "WIN" : "LOSS"}
                </span>
                <span className="text-xs text-zinc-400">
                  {lastMatchParticipant.championName}
                </span>
                <span className="text-xs text-zinc-600">
                  {POSITION_LABELS[
                    lastMatchParticipant.teamPosition as keyof typeof POSITION_LABELS
                  ] ?? lastMatchParticipant.teamPosition}
                </span>
              </div>
              <KdaDisplay
                kills={lastMatchParticipant.kills}
                deaths={lastMatchParticipant.deaths}
                assists={lastMatchParticipant.assists}
                size="sm"
              />
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-zinc-300">
                {formatKda(
                  calcKda(
                    lastMatchParticipant.kills,
                    lastMatchParticipant.deaths,
                    lastMatchParticipant.assists,
                  ),
                )}{" "}
                KDA
              </div>
              <div className="text-xs text-zinc-600">
                {Math.floor(player.lastMatch.info.gameDuration / 60)}m
              </div>
            </div>
          </div>
        )}

        {!lastMatchParticipant && (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-600 italic">
            No recent flex match
          </div>
        )}
      </div>
    </Link>
  );
}
