import { Crown, Hourglass, Star, Trophy } from "lucide-react";
import { ROLE_META } from "@/app/components/ui/RoleIcon";
import SectionHeader from "@/app/components/ui/SectionHeader";
import { getCirColor } from "@/app/lib/cirUtils";
import { cn } from "@/app/lib/utils";
import type { AwardCategories } from "./awardCategories";
import NomineeArt from "./NomineeArt";
import { AWARD_ROLE_KEYS, type AwardRoleKey } from "./nomineeViews";

function categoryName(key: AwardRoleKey, overall: string, prefix: string) {
  return key === "overall" ? overall : `${prefix} ${ROLE_META[key].label}`;
}

function Trophies({
  categories,
  overall,
  prefix,
  version,
}: {
  categories: AwardCategories;
  overall: string;
  prefix: string;
  version: string;
}) {
  return (
    <div className="appear-children grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {AWARD_ROLE_KEYS.map((key) => {
        const leader = categories[key][0];
        const runnerUp = categories[key][1];
        const isOverall = key === "overall";
        return (
          <article
            key={key}
            className={cn(
              "flex items-center gap-4 rounded-xl border bg-card p-4",
              isOverall ? "border-medal-gold/50 bg-linear-to-br from-primary/10 to-card" : "border-border",
            )}
          >
            {leader ? (
              <NomineeArt art={leader.art} version={version} size={isOverall ? 60 : 48} />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-faint">?</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary">
                {isOverall && <Crown className="size-3.5" />}
                {categoryName(key, overall, prefix)}
              </p>
              <p className="truncate font-display text-lg font-semibold">{leader?.title ?? "Vacant"}</p>
              {leader && <p className="truncate text-xs text-muted-foreground">{leader.subtitle}</p>}
              {leader ? (
                <p className="num truncate text-xs text-faint mt-1">
                  Score {leader.score.toFixed(1)} ·{" "}
                  <span className={getCirColor(leader.avgCir)}>{leader.avgCir.toFixed(1)} CIR</span>
                  {runnerUp && <> · leads {runnerUp.title} by {(leader.score - runnerUp.score).toFixed(1)}</>}
                </p>
              ) : (
                <p className="text-xs text-faint">Nobody qualifies yet</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/** Who would take each award if the season ended today. */
export default function WinnersBoard({
  roles,
  picks,
  version,
}: {
  roles: AwardCategories;
  picks: AwardCategories;
  version: string;
}) {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm">
        <Hourglass className="size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">Season in progress.</span> These are the live frontrunners —
          standings update with every sync and lock when the season ends.
        </p>
      </div>
      <section>
        <SectionHeader icon={Trophy} title="Player awards" description="Best performer overall and in each role" />
        <Trophies categories={roles} overall="MVP" prefix="Best" version={version} />
      </section>
      <section>
        <SectionHeader icon={Star} title="Signature picks" description="Best player–champion pairing" />
        <Trophies categories={picks} overall="Signature pick" prefix="Signature" version={version} />
      </section>
    </div>
  );
}
