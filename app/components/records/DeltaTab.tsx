import type { MatchRecord } from "@/app/lib/db";
import EmptyState from "@/app/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import { DELTA_LEADERBOARDS, DELTA_LEADERBOARD_ORDER } from "./DeltaConfig";
import { DeltaLeaderboardCard } from "./DeltaLeaderboardCard";

/** Top 10 games by CIR gap against teammates or the lane opponent. */
export default function DeltaTab({ byCategory, version }: { byCategory: Map<string, MatchRecord[]>; version: string }) {
  return (
    <div className="appear-children grid grid-cols-1 gap-6 xl:grid-cols-2">
      {DELTA_LEADERBOARD_ORDER.map((type) => {
        const config = DELTA_LEADERBOARDS[type];
        const records = byCategory.get(config.categoryName) ?? [];
        return (
          <Panel key={type}>
            <PanelHeader
              icon={config.icon}
              iconClassName={config.tone === "best" ? "text-primary" : "text-loss"}
              title={`${config.title} · ${config.subtitle}`}
              description={config.description}
            />
            {records.length === 0 ? (
              <EmptyState title={`No ${config.title.toLowerCase()} games yet`} />
            ) : (
              <div className="divide-y divide-border">
                {records.map((r, i) => (
                  <DeltaLeaderboardCard key={r.matchId + r.puuid} record={r} rank={i + 1} version={version} config={config} />
                ))}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
