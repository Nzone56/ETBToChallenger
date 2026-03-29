import { RoleStats, Position } from "@/app/types/riot";
import { POSITION_LABELS } from "@/app/data/constants";
import { formatWinrate } from "@/app/lib/helpers";
import { getCirColor } from "@/app/lib/cirUtils";
import { Activity } from "lucide-react";

interface RoleSpecializationProps {
  roleStats: RoleStats[];
}

const ROLE_ORDER: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

const ROLE_COLORS: Record<Position, string> = {
  TOP: "bg-blue-500",
  JUNGLE: "bg-rose-500",
  MIDDLE: "bg-yellow-400",
  BOTTOM: "bg-purple-500",
  UTILITY: "bg-lime-400",
};

const ROLE_TEXT_COLORS: Record<Position, string> = {
  TOP: "text-blue-400",
  JUNGLE: "text-rose-400",
  MIDDLE: "text-yellow-400",
  BOTTOM: "text-purple-400",
  UTILITY: "text-lime-400",
};

export default function RoleSpecialization({
  roleStats,
}: RoleSpecializationProps) {
  if (roleStats.length === 0) return null;

  const roleMap = new Map(roleStats.map((r) => [r.position, r]));
  const maxGames = Math.max(...roleStats.map((r) => r.games), 1);

  const activeRoles = ROLE_ORDER.filter((pos) => roleMap.has(pos));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <Activity className="h-3.5 w-3.5 text-teal-400" />
        Role Specialization
      </h2>
      <div className="space-y-3">
        {activeRoles.map((pos) => {
          const role = roleMap.get(pos)!;
          const barWidth = (role.games / maxGames) * 100;
          const wrColor =
            role.winrate >= 50 ? "text-emerald-400" : "text-red-400";
          const cirColor = getCirColor(role.avgCir);

          return (
            <div key={pos}>
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`w-10 text-xs font-bold shrink-0 ${ROLE_TEXT_COLORS[pos]}`}
                >
                  {POSITION_LABELS[pos].toUpperCase().slice(0, 3)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ROLE_COLORS[pos]} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-zinc-500 shrink-0">
                  {role.games}G
                </span>
              </div>
              <div className="flex items-center gap-3 pl-13">
                <span
                  className={`text-[10px] font-semibold tabular-nums ${wrColor}`}
                >
                  {formatWinrate(role.winrate)} WR
                </span>
                {role.avgCir !== undefined && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${cirColor}`}
                    >
                      {role.avgCir.toFixed(1)} CIR
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
