import Link from "next/link";
import { Calendar, Clock, RefreshCw, Users } from "lucide-react";
import Badge from "@/app/components/ui/Badge";
import { formatColombianDate, formatColombianTime } from "@/app/lib/dateUtils";
import { formatDuration } from "@/app/lib/format";
import type { MatchView, TeamView } from "@/app/lib/matchView";
import { playerHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";
import type { Match } from "@/app/types/riot";

function TeamScore({ team, remake, align }: { team: TeamView; remake: boolean; align: "left" | "right" }) {
  const sideText = team.side === "blue" ? "text-side-blue" : "text-side-red";
  return (
    <div className={cn("flex flex-col", align === "right" ? "items-end text-right" : "items-start")}>
      <span className={cn("text-xs font-medium uppercase tracking-wider", sideText)}>
        {team.side === "blue" ? "Blue side" : "Red side"}
      </span>
      <span className="num font-display text-5xl font-semibold leading-tight">{team.totals.kills}</span>
      <span
        className={cn(
          "text-sm font-semibold uppercase tracking-wider",
          remake ? "text-remake" : team.win ? "text-win" : "text-loss",
        )}
      >
        {remake ? "Remake" : team.win ? "Victory" : "Defeat"}
      </span>
    </div>
  );
}

/** Scoreline, when and how long, and which of the roster were in it. */
export default function MatchHeader({ match, view }: { match: Match; view: MatchView }) {
  const [blue, red] = view.teams;
  const start = match.info.gameStartTimestamp;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-side-blue/10 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-side-red/10 to-transparent" />

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-8 lg:px-10">
        <TeamScore team={blue} remake={view.remake} align="left" />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Ranked Flex</p>
          {view.remake && <RefreshCw className="size-5 text-remake" aria-label="Remake" />}
          <p className="num flex items-center gap-1.5 font-display text-2xl font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            {formatDuration(match.info.gameDuration)}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            {formatColombianDate(start)} · {formatColombianTime(start)}
          </p>
        </div>
        <TeamScore team={red} remake={view.remake} align="right" />
      </div>

      {view.challengeParticipants.length > 0 && (
        <div className="relative flex flex-wrap items-center gap-2 border-t border-border px-6 py-3 lg:px-10">
          <Users className="size-4 text-accent" />
          <span className="text-xs text-muted-foreground">
            {view.challengeParticipants.length} from the roster:
          </span>
          {view.challengeParticipants.map((p) => (
            <Link key={p.puuid} href={playerHref(p.riotIdGameName)}>
              <Badge tone="accent" className="transition-colors hover:bg-accent/20">
                {p.riotIdGameName}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
