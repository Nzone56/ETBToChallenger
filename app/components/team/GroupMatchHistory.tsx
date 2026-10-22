"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import EmptyState from "@/app/components/ui/EmptyState";
import MoreButton from "@/app/components/ui/MoreButton";
import Badge from "@/app/components/ui/Badge";
import { RESULT_STRIPE } from "@/app/components/ui/ResultBadge";
import { calcKda, formatDuration, formatKda } from "@/app/lib/format";
import type { GroupMatchRowData as GroupMatchRow } from "@/app/lib/groupMatches";
import { matchHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";

const PAGE_SIZE = 10;

const OUTCOME_LABEL = { win: "Win", loss: "Loss", remake: "Remake", mixed: "Opposing teams" } as const;

/** Every game where two or more of the roster queued together. */
export default function GroupMatchHistory({ rows }: { rows: GroupMatchRow[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  return (
    <Panel>
      <PanelHeader icon={Users} title="Stacked games" description={`${rows.length} games with two or more of us`} />
      {rows.length === 0 ? (
        <EmptyState title="No stacked games yet" />
      ) : (
        <ul className="divide-y divide-border">
          {rows.slice(0, visible).map((row) => (
            <li key={row.matchId}>
              <Link href={matchHref(row.matchId)} className="relative flex items-start gap-4 py-3 pl-5 pr-4 transition-colors hover:bg-muted">
                <span
                  className={cn(
                    "absolute inset-y-2 left-0 w-1 rounded-r-full",
                    row.outcome === "mixed" ? "bg-primary" : RESULT_STRIPE[row.outcome],
                  )}
                />
                <div className="w-32 shrink-0">
                  <Badge tone={row.outcome === "mixed" ? "primary" : row.outcome} size="xs">
                    {OUTCOME_LABEL[row.outcome]}
                  </Badge>
                  <p className="num mt-1.5 text-xs text-faint">
                    {row.players.length} of us · {formatDuration(row.duration)}
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                  {row.players.map((p) => (
                    <p key={p.puuid} className="flex items-center gap-2 text-xs">
                      <span className={cn("size-1.5 shrink-0 rounded-full", p.win ? "bg-win" : "bg-loss")} />
                      <span className="truncate font-medium text-foreground">{p.gameName}</span>
                      <span className="truncate text-muted-foreground">{p.championName}</span>
                      <span className="num ml-auto shrink-0 text-muted-foreground">
                        {p.kills}/{p.deaths}/{p.assists}
                      </span>
                      <span className="num w-10 shrink-0 text-right text-faint">
                        {formatKda(calcKda(p.kills, p.deaths, p.assists))}
                      </span>
                    </p>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {visible < rows.length && (
        <MoreButton onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Show {Math.min(PAGE_SIZE, rows.length - visible)} more · {rows.length - visible} left
        </MoreButton>
      )}
    </Panel>
  );
}
