import type { StackCombo } from "@/app/lib/rukawaAnalytics";
import { cn } from "@/app/lib/utils";
import DossierPanel from "./DossierPanel";

/** Lineups with Rukawa in them, and who carried whom. */
export default function LineupList({ title, combos }: { title: string; combos: StackCombo[] }) {
  return (
    <DossierPanel title={title}>
      {combos.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">No lineups on file</p>
      ) : (
        <ul className="max-h-112 space-y-2 overflow-y-auto pr-1">
          {combos.map((c) => {
            const teamCarried = c.avgCirDifference > 0;
            return (
              <li key={c.puuids.join("-")} className="rounded-lg border border-border bg-raised/60 px-4 py-3">
                <p className="text-xs leading-relaxed text-muted-foreground">{c.players.join(" · ")}</p>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className={cn("num font-display text-lg font-semibold", c.winrate >= 50 ? "text-win" : "text-loss")}>
                    {c.winrate.toFixed(0)}% <span className="text-xs font-normal text-faint">WR · {c.games}G</span>
                  </span>
                  <span className={cn("num text-xs", teamCarried ? "text-win" : "text-pillar-pressure")}>
                    {teamCarried ? "👍 Team carried" : "🎯 Rukawa carried"}{" "}
                    <span className="font-semibold">
                      {teamCarried ? "+" : ""}
                      {c.avgCirDifference.toFixed(1)}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DossierPanel>
  );
}
