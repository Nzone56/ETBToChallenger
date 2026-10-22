import Link from "next/link";
import { Star } from "lucide-react";
import type { PentakillEvent } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { formatColombianDate } from "@/app/lib/dateUtils";
import { matchHref } from "@/app/lib/roster";

/** A pentakill, and the game it happened in. */
export default function PentakillCard({ event, version }: { event: PentakillEvent; version: string }) {
  return (
    <Link
      href={matchHref(event.matchId)}
      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-primary/30 bg-linear-to-br from-primary/10 to-card p-4 transition-colors hover:border-primary/60"
    >
      <ChampionIcon championName={event.championName} version={version} size={52} className="ring-primary/50" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-display text-lg font-semibold uppercase tracking-wider text-primary">
          <Star className="size-4 fill-primary" />
          Pentakill
          {event.pentaKills > 1 && <span className="text-sm">×{event.pentaKills}</span>}
        </p>
        <p className="truncate text-sm font-semibold">{event.gameName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {event.championName} · {formatColombianDate(event.playedAt)}
        </p>
      </div>
    </Link>
  );
}
