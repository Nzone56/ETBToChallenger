"use client";

import { useState } from "react";
import type { CirRoleEntry } from "@/app/lib/db";
import { POSITION_LABELS } from "@/app/data/constants";
import { cn } from "@/app/lib/utils";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { Activity } from "lucide-react";
import { cirLabel } from "@/app/components/records/RecordData";

type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
const ROLES: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

interface RoleCirLeaderboardProps {
  entries: CirRoleEntry[];
  players: { gameName: string; profileIconId: number | null }[];
  version: string;
}

export default function RoleCirLeaderboard({
  entries,
  players,
  version,
}: RoleCirLeaderboardProps) {
  const [selectedRole, setSelectedRole] = useState<Position>("TOP");

  const iconMap = new Map(players.map((p) => [p.gameName, p.profileIconId]));

  const roleData = entries
    .filter((e) => e.position === selectedRole && e.games >= 3)
    .map((e) => ({ ...e, profileIconId: iconMap.get(e.gameName) ?? null }))
    .sort((a, b) => b.avgCir - a.avgCir);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
          <Activity className="h-4 w-4 text-amber-400" />
          Avg CIR by Role
        </h2>
      </div>

      {/* Role selector */}
      <div className="flex border-b border-zinc-800/50 px-2 py-2 gap-1">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              selectedRole === role
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer",
            )}
          >
            {POSITION_LABELS[role]}
          </button>
        ))}
      </div>

      {/* Rankings */}
      <div className="divide-y divide-zinc-800/50">
        {roleData.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">
            No data for this role{" "}
            <span className="text-zinc-700">(min 3 games)</span>
          </div>
        ) : (
          roleData.map((player, index) => {
            const medalColors = [
              "text-yellow-400",
              "text-zinc-300",
              "text-amber-600",
            ];
            const { color } = cirLabel(player.avgCir);
            return (
              <div
                key={player.gameName}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-800/30"
              >
                <span
                  className={cn(
                    "w-5 text-center text-xs font-bold",
                    index < 3 ? medalColors[index] : "text-zinc-600",
                  )}
                >
                  {index + 1}
                </span>
                <ProfileIcon
                  iconId={player.profileIconId}
                  version={version}
                  size={24}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-zinc-200">
                    {player.gameName}
                  </span>
                </div>
                <div className="text-right">
                  <span className={cn("text-sm font-semibold tabular-nums", color)}>
                    {player.avgCir.toFixed(1)}
                  </span>
                  <span className="ml-1.5 text-xs text-zinc-600">
                    {player.games}G
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
