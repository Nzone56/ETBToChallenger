import { Target } from "lucide-react";
import type { RolePerformance } from "@/app/lib/rukawaAnalytics";
import { roleLabel } from "@/app/components/ui/RoleIcon";
import { getCirColor } from "@/app/lib/cirUtils";
import { cn } from "@/app/lib/utils";
import DossierPanel from "./DossierPanel";

/** Rukawa's CIR by role, best to worst. */
export default function RoleImpact({ roles }: { roles: RolePerformance[] }) {
  const sorted = [...roles].sort((a, b) => b.avgCir - a.avgCir);

  return (
    <DossierPanel icon={Target} title="Role impact analysis">
      <ul className="space-y-2">
        {sorted.map((r, i) => {
          const best = i === 0;
          const worst = i === sorted.length - 1 && sorted.length > 1;
          return (
            <li
              key={r.role}
              className={cn(
                "flex items-center justify-between rounded-lg border bg-raised/60 px-4 py-3",
                best ? "border-win/40" : worst ? "border-loss/40" : "border-border",
              )}
            >
              <div>
                <p className="text-sm font-semibold">
                  {roleLabel(r.role)}
                  {best && <span className="ml-2 text-xs font-normal text-win">✨ Pure luck</span>}
                  {worst && <span className="ml-2 text-xs font-normal text-loss">💔 Emotional damage</span>}
                </p>
                <p className="num text-xs text-faint">{r.games} games</p>
              </div>
              <div className="text-right">
                <p className={cn("num font-display text-xl font-semibold", getCirColor(r.avgCir))}>{r.avgCir.toFixed(1)}</p>
                <p className="num text-xs text-faint">{r.winrate.toFixed(0)}% WR</p>
              </div>
            </li>
          );
        })}
      </ul>
    </DossierPanel>
  );
}
