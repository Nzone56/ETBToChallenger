"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import EmptyState from "@/app/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { ROLE_META, ROLE_ORDER } from "@/app/components/ui/RoleIcon";
import type { PlayerStackStats } from "@/app/lib/db";
import type { LastGame } from "@/app/lib/lastGame";
import type { RosterPlayer } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";
import { buildLeaderboardRows, type RoleFilter, type StackFilter } from "./leaderboardRows";
import StandingsRow, { STANDINGS_COLUMNS } from "./StandingsRow";

const ROLE_OPTIONS = [
  { value: "ALL" as RoleFilter, label: "All roles" },
  ...ROLE_ORDER.map((r) => ({ value: r as RoleFilter, label: ROLE_META[r].label })),
];

const STACK_OPTIONS: { value: StackFilter; label: string }[] = [
  { value: "all", label: "Any stack" },
  { value: "solo", label: "Solo" },
  { value: "duo", label: "Duo" },
  { value: "trio", label: "Trio" },
  { value: "penta", label: "5-stack" },
];

interface StandingsProps {
  players: RosterPlayer[];
  stackStats: PlayerStackStats[];
  lastGames: Record<string, LastGame | null>;
  version: string;
}

/**
 * The roster as one table: ladder position, record and last game per player.
 * Unfiltered it ranks by ladder LP; a role or stack filter re-ranks by winrate
 * in that slice. Role and stack are exclusive (no role × stack breakdown).
 */
export default function Standings({ players, stackStats, lastGames, version }: StandingsProps) {
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [stack, setStack] = useState<StackFilter>("all");
  const rows = buildLeaderboardRows(players, stackStats, role, stack);
  const overall = role === "ALL" && stack === "all";

  return (
    <Panel className="@container">
      <PanelHeader
        icon={Trophy}
        title="Standings"
        description={overall ? "Ranked by ladder LP" : "Ranked by winrate in the filter"}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <SegmentedControl
          options={ROLE_OPTIONS}
          value={role}
          onChange={(v) => {
            setRole(v);
            if (v !== "ALL") setStack("all");
          }}
          ariaLabel="Filter by role"
        />
        <SegmentedControl
          options={STACK_OPTIONS}
          value={stack}
          onChange={(v) => {
            setStack(v);
            if (v !== "all") setRole("ALL");
          }}
          ariaLabel="Filter by stack size"
        />
      </div>

      <div
        className={cn(STANDINGS_COLUMNS, "border-b border-border px-4 py-2 text-[10px] @md:px-5 font-medium uppercase tracking-wider text-faint")}
        aria-hidden
      >
        <span>#</span>
        <span>Player</span>
        <span className="text-right">LP</span>
        <span className="hidden @2xl:block">{overall ? "Season record" : "Record in filter"}</span>
        <span className="hidden @5xl:block">Last game</span>
        <span className="hidden @5xl:block" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No games for this filter" />
      ) : (
        <ol key={`${role}-${stack}`} className="appear-children divide-y divide-border">
          {rows.map((row, i) => (
            <li key={row.player.puuid}>
              <StandingsRow row={row} position={i + 1} lastGame={lastGames[row.player.puuid] ?? null} version={version} />
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
