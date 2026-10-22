import { Scale } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import { formatCompact } from "@/app/lib/format";
import type { MatchView, TeamTotals } from "@/app/lib/matchView";

const ROWS: { key: keyof TeamTotals; label: string; compact?: boolean }[] = [
  { key: "kills", label: "Kills" },
  { key: "damage", label: "Damage dealt", compact: true },
  { key: "damageTaken", label: "Damage taken", compact: true },
  { key: "gold", label: "Gold earned", compact: true },
  { key: "cs", label: "CS" },
  { key: "vision", label: "Vision score" },
  { key: "towers", label: "Towers" },
  { key: "dragons", label: "Dragons" },
];

function CompareBar({ label, blue, red, format }: { label: string; blue: number; red: number; format: (v: number) => string }) {
  const total = blue + red;
  const bluePct = total > 0 ? (blue / total) * 100 : 50;
  return (
    <div>
      <div className="num mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-side-blue">{format(blue)}</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-semibold text-side-red">{format(red)}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${label}: blue ${format(blue)}, red ${format(red)}`}>
        <div className="grow-x rounded-full bg-side-blue" style={{ width: `${bluePct}%` }} />
        <div className="flex-1 rounded-full bg-side-red" />
      </div>
    </div>
  );
}

/** Blue against red, stat by stat. */
export default function MatchStats({ view }: { view: MatchView }) {
  const [blue, red] = view.teams;
  const roster = view.challengeParticipants;
  const rosterKills = roster.reduce((s, p) => s + p.kills, 0);
  const rosterDamage = roster.reduce((s, p) => s + p.totalDamageDealtToChampions, 0);

  return (
    <Panel>
      <PanelHeader
        icon={Scale}
        title="Team comparison"
        description={
          roster.length > 0
            ? `The roster brought ${rosterKills} kills and ${formatCompact(rosterDamage)} damage`
            : undefined
        }
      />
      <div className="grid gap-x-10 gap-y-5 p-5 md:grid-cols-2">
        {ROWS.map(({ key, label, compact }) => (
          <CompareBar
            key={key}
            label={label}
            blue={blue.totals[key]}
            red={red.totals[key]}
            format={compact ? formatCompact : (v) => v.toString()}
          />
        ))}
      </div>
    </Panel>
  );
}
