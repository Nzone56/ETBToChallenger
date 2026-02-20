import { PentakillEvent } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { Star } from "lucide-react";

interface PentakillCounterProps {
  events: PentakillEvent[];
  version: string;
  playerNames: Record<string, string>; // puuid → gameName
}

export default function PentakillCounter({
  events,
  version,
  playerNames,
}: PentakillCounterProps) {
  if (events.length === 0) {
    return (
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Star className="h-4 w-4 text-indigo-400" />
          Pentakill Counter
          <span className="text-xs font-normal text-zinc-600">
            (0 pentakills)
          </span>
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
          No pentakills yet — go get one!
        </div>
      </div>
    );
  }

  // Group by puuid for totals
  const totals: Record<string, number> = {};
  for (const e of events) {
    totals[e.puuid] = (totals[e.puuid] ?? 0) + e.pentaKills;
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        <Star className="h-4 w-4 text-indigo-400" />
        Pentakill Counter
        <span className="text-xs font-normal text-zinc-600">
          ({events.reduce((s, e) => s + e.pentaKills, 0)} total)
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => {
          const name = playerNames[e.puuid] ?? e.gameName;
          const date = new Date(e.playedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <div
              key={e.matchId + e.puuid}
              className="flex items-center gap-3 rounded-xl border border-indigo-800/30 bg-indigo-950/20 px-4 py-3 backdrop-blur-sm"
            >
              <ChampionIcon
                championName={e.championName}
                version={version}
                size={40}
                className="rounded-lg shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-100 truncate">
                    {name}
                  </span>
                  {e.pentaKills > 1 && (
                    <span className="rounded bg-indigo-500/20 px-1 py-0.5 text-[10px] font-bold text-indigo-300">
                      ×{e.pentaKills}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {e.championName}
                </div>
                <div className="text-[10px] text-zinc-600">{date}</div>
              </div>
              <div className="shrink-0 text-right">
                <Star className="h-5 w-5 text-indigo-400 fill-indigo-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
