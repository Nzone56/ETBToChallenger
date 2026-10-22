import { FileWarning } from "lucide-react";
import type { RukawaAnalytics } from "@/app/lib/rukawaAnalytics";
import BronzeWall from "./rukawa/BronzeWall";
import DrainList from "./rukawa/DrainList";
import LineupList from "./rukawa/LineupList";
import RoleImpact from "./rukawa/RoleImpact";
import SynergyMatrix from "./rukawa/SynergyMatrix";

/** The Rukawa Files: a classified, entirely affectionate investigation. */
export default function RukawaFiles({ analytics }: { analytics: RukawaAnalytics }) {
  return (
    <div className="appear-children space-y-6">
      <header className="relative overflow-hidden rounded-xl border border-dossier/40 bg-card px-6 py-5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgb(240_136_62/0.05)_14px_28px)]" />
        <div className="relative flex items-center gap-4">
          <FileWarning className="size-8 text-dossier" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-dossier/80">Top secret · Deep analytics</p>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wider text-dossier">
              Classified: The Rukawa Files
            </h2>
          </div>
          <span className="ml-auto hidden -rotate-6 rounded border-2 border-loss/60 px-3 py-1 font-mono text-sm font-bold uppercase tracking-widest text-loss/80 md:block">
            Eyes only
          </span>
        </div>
      </header>

      <SynergyMatrix synergy={analytics.synergyMatrix} />

      <div className="grid gap-6 xl:grid-cols-2">
        <DrainList
          title="The Rukawa curse"
          description="Teammate winrate without Rukawa → with Rukawa"
          calloutLabel="Most affected"
          format={(v) => `${v.toFixed(1)}%`}
          rows={analytics.winrateImpact.map((w) => ({
            key: w.puuid,
            teammate: w.teammate,
            without: w.wrWithoutRukawa,
            with: w.wrWithRukawa,
            drain: w.wrDrain,
            withoutSub: `${w.gamesWithoutRukawa}G`,
            withSub: `${w.gamesWithRukawa}G`,
          }))}
        />
        <DrainList
          title="The Rukawa tax"
          description="Teammate avg CIR without Rukawa → with Rukawa"
          calloutLabel="Biggest victim"
          format={(v) => v.toFixed(1)}
          rows={analytics.rukawaTax.map((t) => ({
            key: t.puuid,
            teammate: t.teammate,
            without: t.avgCirWithoutRukawa,
            with: t.avgCirWithRukawa,
            drain: t.cirDrain,
          }))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LineupList title="Trio lineups" combos={analytics.stack3Combos} />
        <LineupList title="Full team lineups · 5-stack" combos={analytics.stack5Combos.filter((c) => c.players.length === 5)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RoleImpact roles={analytics.rolePerformance} />
        <BronzeWall
          lpDonated={analytics.lpDonated}
          lowestCirGames={analytics.lowestCirMatches.length}
          totalGames={analytics.totalSeasonGames}
        />
      </div>
    </div>
  );
}
