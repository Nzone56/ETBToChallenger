import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import CirBadge from "@/app/components/ui/CirBadge";
import KdaDisplay from "@/app/components/ui/KdaDisplay";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankBadge from "@/app/components/ui/RankBadge";
import RankNumber from "@/app/components/ui/RankNumber";
import ResultBadge from "@/app/components/ui/ResultBadge";
import { roleLabel } from "@/app/components/ui/RoleIcon";
import WinrateBar from "@/app/components/ui/WinrateBar";
import { TIER_COLORS } from "@/app/data/constants";
import { formatColombianDateShort } from "@/app/lib/dateUtils";
import { formatNumber, formatWinrate } from "@/app/lib/format";
import type { LastGame } from "@/app/lib/lastGame";
import { playerHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";
import type { LeaderboardRow } from "./leaderboardRows";

/**
 * Column template shared by the header and every row, so they always line
 * up. Sized by the Standings panel's @container: the last-game column only
 * appears once the panel is wide enough to hold it.
 */
export const STANDINGS_COLUMNS =
  "grid grid-cols-[1.25rem_minmax(0,1fr)_3.5rem] gap-x-3 @md:grid-cols-[1.5rem_minmax(0,1fr)_5.5rem] @md:gap-x-5 @2xl:grid-cols-[1.5rem_minmax(0,1.3fr)_5.5rem_minmax(0,1fr)] @5xl:grid-cols-[1.5rem_minmax(0,1.2fr)_5.5rem_minmax(0,1fr)_minmax(0,1.5fr)_1rem] items-center";

interface StandingsRowProps {
  row: LeaderboardRow;
  position: number;
  lastGame: LastGame | null;
  version: string;
}

export default function StandingsRow({ row, position, lastGame, version }: StandingsRowProps) {
  const { player, wins, games, winrate } = row;

  return (
    <Link
      href={playerHref(player.gameName)}
      className={cn(STANDINGS_COLUMNS, "group px-4 py-3 transition-colors hover:bg-muted @md:px-5")}
    >
      <RankNumber position={position} />

      <div className="flex min-w-0 items-center gap-3">
        <ProfileIcon
          iconId={player.profileIconId}
          version={version}
          size={40}
          className="ring-2"
          ringColor={player.tier ? TIER_COLORS[player.tier] : undefined}
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{player.gameName}</span>
            {player.flexEntry?.hotStreak && (
              <Flame className="size-3.5 shrink-0 text-cir-dominant" aria-label="Hot streak" />
            )}
          </p>
          <RankBadge entry={player.flexEntry} size="sm" />
        </div>
      </div>

      <div className="text-right">
        <p className="num font-display text-lg font-semibold leading-none">{formatNumber(player.totalLp)}</p>
        <p className="mt-1 hidden text-[10px] uppercase tracking-wider text-faint @md:block">ladder LP</p>
      </div>

      <div className="hidden @2xl:block">
        <div className="num mb-1.5 flex items-baseline justify-between text-xs">
          <span className={cn("font-semibold", winrate >= 50 ? "text-win" : "text-loss")}>{formatWinrate(winrate)}</span>
          <span className="text-faint">
            {wins}W {games - wins}L
          </span>
        </div>
        <WinrateBar wins={wins} losses={games - wins} showLabel={false} />
      </div>

      <div className="hidden min-w-0 items-center gap-3 @5xl:flex">
        {lastGame ? (
          <>
            <ChampionIcon championName={lastGame.championName} version={version} size={34} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 whitespace-nowrap text-xs">
                <ResultBadge result={lastGame.result} />
                <span className="truncate font-medium">{lastGame.championName}</span>
                <span className="truncate text-faint">
                  {roleLabel(lastGame.position)} · {formatColombianDateShort(lastGame.playedAt)}
                </span>
              </p>
              <KdaDisplay kills={lastGame.kills} deaths={lastGame.deaths} assists={lastGame.assists} size="sm" />
            </div>
            {lastGame.cir !== null && <CirBadge score={lastGame.cir} />}
          </>
        ) : (
          <span className="text-xs text-faint">No game this season</span>
        )}
      </div>

      <ChevronRight className="hidden size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground @5xl:block" />
    </Link>
  );
}
