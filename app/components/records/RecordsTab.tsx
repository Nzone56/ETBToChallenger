import { Skull, Star, Trophy } from "lucide-react";
import type { MatchRecord, PentakillEvent } from "@/app/lib/db";
import EmptyState from "@/app/components/ui/EmptyState";
import SectionHeader from "@/app/components/ui/SectionHeader";
import PentakillCard from "./PentakillCard";
import RecordCard from "./RecordCard";
import { BEST_ORDER, WORST_ORDER } from "./RecordData";

interface RecordsTabProps {
  byCategory: Map<string, MatchRecord[]>;
  pentakills: PentakillEvent[];
  version: string;
}

/** Single-game records, the shameful ones, and every pentakill. */
export default function RecordsTab({ byCategory, pentakills, version }: RecordsTabProps) {
  const top = (cat: string) => byCategory.get(cat)?.[0];
  const pentaCount = pentakills.reduce((s, e) => s + e.pentaKills, 0);

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader icon={Trophy} title="Records" description="The best single games of the season" />
        <div className="appear-children grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {BEST_ORDER.map((cat) => {
            const r = top(cat);
            return r ? <RecordCard key={cat} record={r} version={version} tone="best" /> : null;
          })}
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Skull}
          iconClassName="text-loss"
          title="Records'nt"
          description="The other kind of record · farm, gold and damage exclude support"
        />
        <div className="appear-children grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {WORST_ORDER.map((cat) => {
            const r = top(cat);
            return r ? <RecordCard key={cat} record={r} version={version} tone="worst" /> : null;
          })}
        </div>
      </section>

      <section>
        <SectionHeader icon={Star} title="Pentakills" description={`${pentaCount} this season`} />
        {pentakills.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border">
            <EmptyState icon={Star} title="No pentakills yet" description="Go get one." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pentakills.map((e) => (
              <PentakillCard key={e.matchId + e.puuid} event={e} version={version} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
