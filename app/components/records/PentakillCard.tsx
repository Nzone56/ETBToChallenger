import { PentakillEvent } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { formatColombianDate } from "@/app/lib/dateUtils";
import { Star } from "lucide-react";
import Link from "next/link";

function PentakillCard({
  event,
  version,
}: {
  event: PentakillEvent;
  version: string;
}) {
  const date = formatColombianDate(event.playedAt);

  return (
    <Link
      href={`/match/${event.matchId}`}
      className="flex items-center gap-3 rounded-xl border border-indigo-800/30 bg-indigo-950/20 px-4 py-3 backdrop-blur-sm hover:bg-indigo-950/30 transition-colors cursor-pointer"
    >
      <ChampionIcon
        championName={event.championName}
        version={version}
        size={44}
        className="shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Star className="h-4 w-4 text-indigo-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Pentakill
          </span>
          {event.pentaKills > 1 && (
            <span className="rounded bg-indigo-500/20 px-1 py-0.5 text-[10px] font-bold text-indigo-300">
              ×{event.pentaKills}
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-indigo-300">PENTA</div>
        <div className="text-xs text-zinc-400 truncate">
          {event.championName}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-zinc-200 truncate max-w-20">
          {event.gameName}
        </div>
        <div className="text-[10px] text-zinc-600">{date}</div>
      </div>
    </Link>
  );
}

export default PentakillCard;
