import { Panel } from "@/app/components/ui/Panel";
import { PlayerAggregatedStats } from "@/app/types/riot";
import { cn } from "@/app/lib/utils";
import { STAT_SECTIONS } from "./playerStatConfigs";

/**
 * Season averages in three groups. A figure turns win-green or loss-red only
 * past the thresholds in playerStatConfigs; in between it stays neutral.
 */
export default function PlayerStatsGrid({ stats }: { stats: PlayerAggregatedStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {STAT_SECTIONS.map((section) => (
        <Panel key={section.title} className="px-4 py-3">
          <h3 className="mb-1 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </h3>
          <dl>
            {section.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
              >
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  {stat.icon}
                  {stat.label}
                </dt>
                <dd className={cn("num text-sm font-semibold", stat.getColor(stats))}>
                  {stat.getValue(stats)}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      ))}
    </div>
  );
}
