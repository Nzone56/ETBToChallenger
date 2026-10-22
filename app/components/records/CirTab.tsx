import { Crown } from "lucide-react";
import type { MatchRecord } from "@/app/lib/db";
import { CIR_LEGENDARY_MIN, CIR_POOR_BELOW } from "@/app/lib/cirUtils";
import SectionHeader from "@/app/components/ui/SectionHeader";
import CirLeaderboards from "./CirLeaderboards";
import CountRanking from "./CountRanking";
import { countCirAppearances } from "./RecordData";

/** Who keeps showing up in the CIR leaderboards — and the leaderboards. */
export default function CirTab({ byCategory, version }: { byCategory: Map<string, MatchRecord[]>; version: string }) {
  const counts = countCirAppearances(byCategory);

  // Only the CIR lists cross to the client, sorted the way they're shown.
  const lists: Record<string, MatchRecord[]> = {};
  for (const [cat, records] of byCategory) {
    if (cat.startsWith("Top CIR")) lists[cat] = [...records].sort((a, b) => b.value - a.value);
    else if (cat.startsWith("Worst CIR")) lists[cat] = [...records].sort((a, b) => a.value - b.value);
  }

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader icon={Crown} title="CIR player rankings" description="Counted over the per-role leaderboards" />
        <div className="appear-children grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <CountRanking title="Top-15 entries" description="Games in a role's top 15" rows={counts.topAppearances} unit="entries" variant="best" />
          <CountRanking title="Legendary games" description={`CIR ${CIR_LEGENDARY_MIN} or more`} rows={counts.legendary} unit="legendary" variant="best" />
          <CountRanking title="Worst-15 entries" description="Games in a role's worst 15" rows={counts.worstAppearances} unit="entries" variant="worst" />
          <CountRanking title="Poor games" description={`CIR under ${CIR_POOR_BELOW}`} rows={counts.poor} unit="poor" variant="worst" />
        </div>
      </section>
      <CirLeaderboards lists={lists} version={version} />
    </div>
  );
}
