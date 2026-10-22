import { Flag, Swords, Target } from "lucide-react";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankEmblem from "@/app/components/ui/RankEmblem";
import StatTile from "@/app/components/ui/StatTile";
import TierProgressBar from "@/app/components/ui/TierProgressBar";
import {
  AVG_LP_PER_WIN,
  CHALLENGER_LP,
  TIER_COLORS,
} from "@/app/data/constants";
import { computeAverageElo, lpToTier } from "@/app/lib/elo";
import { formatNumber, formatWinrate } from "@/app/lib/format";
import type { RosterPlayer } from "@/app/lib/roster";
import type { RankTier } from "@/app/types/riot";

interface ChallengeHeroProps {
  roster: RosterPlayer[];
  version: string;
}

/** Where the team stands on the road to Challenger. The page's first answer. */
export default function ChallengeHero({ roster, version }: ChallengeHeroProps) {
  const { avgLp, avgTierLabel } = computeAverageElo(roster.map((p) => p.flexEntry));
  const avgTier = lpToTier(avgLp) as RankTier;
  const lpToGo = Math.max(CHALLENGER_LP - avgLp, 0);
  const winsNeeded = Math.ceil(lpToGo / AVG_LP_PER_WIN);

  const games = roster.reduce((s, p) => s + p.stats.totalGames, 0);
  const wins = roster.reduce((s, p) => s + p.stats.wins, 0);

  const pins = roster
    .filter((p) => p.flexEntry)
    .map((p) => ({
      key: p.puuid,
      lp: p.totalLp,
      title: `${p.gameName} · ${p.totalLp} LP`,
      node: (
        <ProfileIcon
          iconId={p.profileIconId}
          version={version}
          size={28}
          className="ring-2"
          ringColor={p.tier ? TIER_COLORS[p.tier] : undefined}
        />
      ),
    }));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {/* Gold horizon */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative grid gap-8 p-6 lg:grid-cols-[1fr_auto] lg:p-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Flex Queue · Season 2026
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Road to Challenger
          </h1>
          <div className="mt-5 flex items-center gap-4">
            <RankEmblem tier={avgTier} size={56} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Team average · {roster.length} players
              </p>
              <p className="font-display text-2xl font-semibold" style={{ color: TIER_COLORS[avgTier] }}>
                {avgTierLabel}
              </p>
            </div>
            <div className="ml-2 border-l border-border pl-5">
              <p className="num font-display text-4xl font-semibold leading-none">{formatNumber(avgLp)}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">ladder LP</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 self-end lg:w-104">
          <StatTile
            icon={Flag}
            label="To go"
            value={formatNumber(lpToGo)}
            sub="LP to Challenger"
            valueClassName="text-primary"
            className="bg-raised"
          />
          <StatTile
            icon={Target}
            label="Wins"
            value={`~${formatNumber(winsNeeded)}`}
            sub={`at ${AVG_LP_PER_WIN} LP / win`}
            className="bg-raised"
          />
          <StatTile
            icon={Swords}
            label="Record"
            value={formatWinrate(games > 0 ? (wins / games) * 100 : 0)}
            sub={`${wins}W ${games - wins}L`}
            className="bg-raised"
          />
        </div>
      </div>

      <div className="relative border-t border-border bg-background/40 px-6 pb-6 pt-4 lg:px-8">
        <TierProgressBar currentLp={avgLp} pins={pins} />
      </div>
    </section>
  );
}
