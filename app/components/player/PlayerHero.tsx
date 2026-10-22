import { Activity, Crosshair, Swords, Trophy } from "lucide-react";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankBadge from "@/app/components/ui/RankBadge";
import StatTile from "@/app/components/ui/StatTile";
import Badge from "@/app/components/ui/Badge";
import RoleIcon, { roleLabel } from "@/app/components/ui/RoleIcon";
import { TIER_COLORS } from "@/app/data/constants";
import { getCirTier } from "@/app/lib/cirUtils";
import { formatKda, formatNumber, formatWinrate } from "@/app/lib/format";
import type { RosterPlayer } from "@/app/lib/roster";

interface PlayerHeroProps {
  player: RosterPlayer;
  version: string;
  /** Splash art of their most played champion */
  skinUrl: string | null;
  mainChampion: string | null;
}

/** The player banner: who they are, where they stand, how they play. */
export default function PlayerHero({ player, version, skinUrl, mainChampion }: PlayerHeroProps) {
  const { stats, flexEntry } = player;
  const wins = flexEntry?.wins ?? 0;
  const losses = flexEntry?.losses ?? 0;
  const games = wins + losses;
  const cir = getCirTier(stats.avgCir);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {skinUrl && (
        <>
          <img
            src={skinUrl}
            alt=""
            className="absolute inset-y-0 right-0 h-full w-full object-cover object-[center_20%] opacity-70 lg:w-3/4"
          />
          <div className="absolute inset-0 bg-linear-to-r from-card via-card/85 to-card/20" />
          <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent" />
        </>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative flex flex-col gap-8 p-6 lg:p-8">
        <div className="flex items-center gap-5">
          <ProfileIcon
            iconId={player.profileIconId}
            version={version}
            size={88}
            className="ring-2 ring-offset-4 ring-offset-card"
            ringColor={player.tier ? TIER_COLORS[player.tier] : undefined}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {stats.primaryRole && (
                <Badge size="xs">
                  <RoleIcon position={stats.primaryRole} className="size-3" />
                  {roleLabel(stats.primaryRole)} main
                </Badge>
              )}
              {mainChampion && <Badge size="xs">Most played · {mainChampion}</Badge>}
            </div>
            <h1 className="mt-2 truncate font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {player.gameName}
              <span className="ml-2 text-lg font-normal text-faint">#{player.tagLine}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <RankBadge entry={flexEntry} size="lg" />
              <span className="num text-sm text-muted-foreground">
                {formatNumber(player.totalLp)} ladder LP
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:max-w-3xl">
          <StatTile
            icon={Trophy}
            label="Winrate"
            value={games > 0 ? formatWinrate((wins / games) * 100) : "—"}
            sub={`${wins}W ${losses}L`}
            valueClassName={wins >= losses ? "text-win" : "text-loss"}
            className="bg-raised/80 backdrop-blur-sm"
          />
          <StatTile
            icon={Activity}
            label="Avg CIR"
            value={stats.avgCir.toFixed(1)}
            sub={cir.label}
            valueClassName={cir.text}
            className="bg-raised/80 backdrop-blur-sm"
          />
          <StatTile
            icon={Crosshair}
            label="KDA"
            value={formatKda(stats.avgKda)}
            sub={`${stats.avgKills.toFixed(1)} / ${stats.avgDeaths.toFixed(1)} / ${stats.avgAssists.toFixed(1)}`}
            className="bg-raised/80 backdrop-blur-sm"
          />
          <StatTile
            icon={Swords}
            label="Games"
            value={stats.totalGames}
            sub={`${stats.championStats.length} champions`}
            className="bg-raised/80 backdrop-blur-sm"
          />
        </div>
      </div>
    </section>
  );
}
