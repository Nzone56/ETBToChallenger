import { Crown, Flame, Landmark, Sparkle } from "lucide-react";
import { Panel } from "@/app/components/ui/Panel";
import { formatCompact } from "@/app/lib/format";
import type { TeamView } from "@/app/lib/matchView";
import { cn } from "@/app/lib/utils";
import ParticipantRow from "./ParticipantRow";

interface MatchTeamTableProps {
  team: TeamView;
  remake: boolean;
  minutes: number;
  version: string;
}

const COLUMNS = ["Player", "KDA", "Damage", "Gold", "CS", "Vision", "CIR", "Items"];

/** One side's scoreboard. */
export default function MatchTeamTable({ team, remake, minutes, version }: MatchTeamTableProps) {
  const { totals } = team;
  const objectives = [
    { icon: Landmark, label: "Towers", value: totals.towers },
    { icon: Flame, label: "Dragons", value: totals.dragons },
    { icon: Crown, label: "Barons", value: totals.barons },
    { icon: Sparkle, label: "Heralds", value: totals.heralds },
  ];

  return (
    <Panel>
      <header className="relative flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-5 py-3">
        <span className={cn("absolute inset-y-0 left-0 w-1", team.side === "blue" ? "bg-side-blue" : "bg-side-red")} />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider">
          <span className={team.side === "blue" ? "text-side-blue" : "text-side-red"}>
            {team.side === "blue" ? "Blue side" : "Red side"}
          </span>
          <span className="mx-2 text-faint">·</span>
          <span className={remake ? "text-remake" : team.win ? "text-win" : "text-loss"}>
            {remake ? "Remake" : team.win ? "Victory" : "Defeat"}
          </span>
        </h2>
        <span className="num text-sm text-muted-foreground">
          {totals.kills} / {totals.deaths} / {totals.assists}
        </span>
        <span className="num text-sm text-muted-foreground">{formatCompact(totals.damage)} damage</span>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          {objectives.map(({ icon: Icon, label, value }) => (
            <span key={label} className="num flex items-center gap-1" title={label}>
              <Icon className="size-3.5 text-faint" />
              {value}
            </span>
          ))}
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-224">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-faint">
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  className={cn(
                    "py-2 font-medium",
                    i === 0 ? "pl-5 pr-3 text-left" : i === COLUMNS.length - 1 ? "pl-3 pr-5 text-left" : i === 6 ? "px-3 text-center" : "px-3 text-right",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.participants.map((p) => (
              <ParticipantRow key={p.puuid} p={p} minutes={minutes} remake={remake} version={version} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
