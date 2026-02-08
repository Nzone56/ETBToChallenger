"use client";

import { useState } from "react";
import { PlayerAggregatedStats, Position } from "@/app/types/riot";
import { formatWinrate } from "@/app/lib/helpers";
import { POSITION_LABELS } from "@/app/data/constants";
import { cn } from "@/app/lib/utils";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { MapPin } from "lucide-react";

interface RoleLeaderboardProps {
  players: {
    gameName: string;
    profileIconId: number | null;
    stats: PlayerAggregatedStats;
  }[];
  version: string;
}

const ROLES: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export default function RoleLeaderboard({
  players,
  version,
}: RoleLeaderboardProps) {
  const [selectedRole, setSelectedRole] = useState<Position>("TOP");

  // For the selected role, find each player's winrate in that role
  const roleData = players
    .map(({ gameName, profileIconId, stats }) => {
      const roleStat = stats.roleStats.find((r) => r.position === selectedRole);
      return {
        gameName,
        profileIconId,
        games: roleStat?.games ?? 0,
        wins: roleStat?.wins ?? 0,
        winrate: roleStat?.winrate ?? 0,
      };
    })
    .filter((p) => p.games > 0)
    .sort((a, b) => b.winrate - a.winrate);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
          <MapPin className="h-4 w-4 text-blue-400" />
          Winrate by Role
        </h2>
      </div>

      {/* Role selector */}
      <div className="flex border-b border-zinc-800/50 px-2 py-2 gap-1">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ",
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
      <div className="divide-y divide-zinc-800/50 stagger-rows">
        {roleData.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">
            No data for this role
          </div>
        ) : (
          roleData.map((player, index) => {
            const medalColors = [
              "text-yellow-400",
              "text-zinc-300",
              "text-amber-600",
            ];
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
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      player.winrate >= 50
                        ? "text-emerald-400"
                        : "text-red-400",
                    )}
                  >
                    {formatWinrate(player.winrate)}
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
