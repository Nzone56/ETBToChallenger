import { Users } from "lucide-react";
import type { SynergyData } from "@/app/lib/rukawaAnalytics";
import { cn } from "@/app/lib/utils";
import DossierPanel from "./DossierPanel";

/** Each teammate's winrate in games with Rukawa. */
export default function SynergyMatrix({ synergy }: { synergy: SynergyData[] }) {
  const sorted = [...synergy].sort((a, b) => b.winrateWithRukawa - a.winrateWithRukawa);
  const best = sorted[0]?.puuid;
  const worst = sorted[sorted.length - 1]?.puuid;

  return (
    <DossierPanel icon={Users} title="Synergy matrix" description="Partner winrates with Rukawa in the game">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {sorted.map((s) => {
          const tag = s.puuid === best ? "👑 Caregiver" : s.puuid === worst ? "🕳️ Black hole" : null;
          return (
            <div
              key={s.puuid}
              className={cn(
                "rounded-lg border bg-raised/60 p-3",
                s.puuid === best ? "border-medal-gold/50" : s.puuid === worst ? "border-loss/50" : "border-border",
              )}
            >
              <p className="h-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tag}</p>
              <p className="mt-1 text-sm font-semibold leading-tight break-words">{s.teammate}</p>
              <p
                className={cn(
                  "num font-display text-2xl font-semibold",
                  s.winrateWithRukawa >= 50 ? "text-win" : "text-loss",
                )}
              >
                {s.winrateWithRukawa.toFixed(0)}%
              </p>
              <p className="num text-xs text-faint">{s.gamesWithRukawa} games together</p>
            </div>
          );
        })}
      </div>
    </DossierPanel>
  );
}
