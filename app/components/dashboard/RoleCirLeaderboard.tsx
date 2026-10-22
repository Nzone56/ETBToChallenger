"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import type { CirRoleEntry } from "@/app/lib/db";
import { getCirTier } from "@/app/lib/cirUtils";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import EmptyState from "@/app/components/ui/EmptyState";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankNumber from "@/app/components/ui/RankNumber";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { ROLE_META, ROLE_ORDER } from "@/app/components/ui/RoleIcon";
import { cn } from "@/app/lib/utils";
import type { Position } from "@/app/types/riot";

const MIN_GAMES = 3;

const OPTIONS = ROLE_ORDER.map((r) => ({ value: r, label: ROLE_META[r].short }));

interface RoleCirLeaderboardProps {
  entries: CirRoleEntry[];
  players: { gameName: string; profileIconId: number | null }[];
  version: string;
}

/** Who has the highest average CIR in each role. */
export default function RoleCirLeaderboard({ entries, players, version }: RoleCirLeaderboardProps) {
  const [role, setRole] = useState<Position>("TOP");
  const iconMap = new Map(players.map((p) => [p.gameName, p.profileIconId]));

  const rows = entries
    .filter((e) => e.position === role && e.games >= MIN_GAMES)
    .sort((a, b) => b.avgCir - a.avgCir);

  return (
    <Panel className="h-full">
      <PanelHeader icon={Activity} title="CIR by role" description={`Average CIR · min. ${MIN_GAMES} games`} />
      <div className="border-b border-border px-4 py-3">
        <SegmentedControl options={OPTIONS} value={role} onChange={setRole} fullWidth ariaLabel="Role" />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nobody qualifies in this role yet" />
      ) : (
        <ol key={role} className="appear-children divide-y divide-border">
          {rows.map((row, i) => {
            const tier = getCirTier(row.avgCir);
            return (
              <li key={row.gameName} className="flex items-center gap-3 px-4 py-2.5">
                <RankNumber position={i + 1} />
                <ProfileIcon iconId={iconMap.get(row.gameName) ?? null} version={version} size={26} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.gameName}</span>
                <span className="num text-xs text-faint">{row.games}G</span>
                <span className={cn("num w-10 text-right font-display text-sm font-semibold", tier.text)}>
                  {row.avgCir.toFixed(1)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
