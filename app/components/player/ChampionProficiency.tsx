import { Swords } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { getCirColor } from "@/app/lib/cirUtils";
import { formatKda, formatWinrate } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { ChampionStats } from "@/app/types/riot";

interface ChampionProficiencyProps {
  champions: ChampionStats[];
  version: string;
}

/** Champion pool, most played first, with winrate and CIR per champion. */
export default function ChampionProficiency({ champions, version }: ChampionProficiencyProps) {
  if (champions.length === 0) return null;
  const sorted = [...champions].sort((a, b) => b.games - a.games);

  return (
    <Panel className="flex flex-col">
      <PanelHeader icon={Swords} title="Champion pool" description={`${sorted.length} champions this season`} />
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_4.5rem_3.5rem_3.5rem] gap-x-3 border-b border-border px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-faint">
        <span>Champion</span>
        <span className="text-right">Games</span>
        <span className="text-right">Winrate</span>
        <span className="text-right">KDA</span>
        <span className="text-right">CIR</span>
      </div>
      <ul className="max-h-96 divide-y divide-border overflow-y-auto">
        {sorted.map((c) => (
          <li
            key={c.championName}
            className="grid grid-cols-[minmax(0,1fr)_3rem_4.5rem_3.5rem_3.5rem] items-center gap-x-3 px-5 py-2"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <ChampionIcon championName={c.championName} version={version} size={28} />
              <span className="truncate text-sm font-medium">{c.championName}</span>
            </span>
            <span className="num text-right text-sm text-muted-foreground">{c.games}</span>
            <span className={cn("num text-right text-sm font-semibold", c.winrate >= 50 ? "text-win" : "text-loss")}>
              {formatWinrate(c.winrate)}
            </span>
            <span className="num text-right text-sm text-muted-foreground">{formatKda(c.avgKda)}</span>
            <span className={cn("num text-right text-sm font-semibold", c.avgCir !== undefined && getCirColor(c.avgCir))}>
              {c.avgCir !== undefined ? c.avgCir.toFixed(1) : "—"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
