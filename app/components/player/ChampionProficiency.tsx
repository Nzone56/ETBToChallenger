import { ChampionStats } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import { getCirColor } from "@/app/lib/cirUtils";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { Trophy } from "lucide-react";

interface ChampionProficiencyProps {
  champions: ChampionStats[];
  version: string;
}

export default function ChampionProficiency({
  champions,
  version,
}: ChampionProficiencyProps) {
  if (champions.length === 0) return null;

  const sorted = [...champions].sort((a, b) => b.games - a.games);

  return (
    <div
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex flex-col"
      style={{ height: "400px" }}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Trophy className="h-3.5 w-3.5 text-yellow-400" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Champion Proficiency
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
        {sorted.map((champ) => {
          const wr = champ.winrate;
          const wrColor =
            wr >= 60
              ? "text-emerald-400"
              : wr >= 50
                ? "text-zinc-300"
                : "text-red-400";
          const cirColor = getCirColor(champ.avgCir);

          return (
            <div
              key={champ.championName}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/20 transition-colors"
            >
              <ChampionIcon
                championName={champ.championName}
                version={version}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {champ.championName}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {champ.games} GAMES
                  <span className="mx-1.5 text-zinc-700">·</span>
                  {formatKda(champ.avgKda)} KDA
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold tabular-nums ${wrColor}`}>
                  {formatWinrate(wr)}
                </span>
                {champ.avgCir !== undefined && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${cirColor}`}
                    >
                      {champ.avgCir.toFixed(1)} CIR
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
