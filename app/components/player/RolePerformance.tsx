import { RoleStats, Position } from "@/app/types/riot";
import { POSITION_LABELS } from "@/app/data/constants";
import { formatWinrate } from "@/app/lib/helpers";
import WinrateBar from "@/app/components/ui/WinrateBar";

interface RolePerformanceProps {
  roleStats: RoleStats[];
}

const ROLE_ORDER: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export default function RolePerformance({ roleStats }: RolePerformanceProps) {
  if (roleStats.length === 0) {
    return null;
  }

  const roleMap = new Map(roleStats.map((r) => [r.position, r]));

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Role Performance
      </h2>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm">
        <div className="space-y-3">
          {ROLE_ORDER.map((pos) => {
            const role = roleMap.get(pos);
            if (!role) {
              return (
                <div key={pos} className="flex items-center gap-3 opacity-40">
                  <span className="w-16 text-xs font-medium text-zinc-500">
                    {POSITION_LABELS[pos]}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-zinc-800" />
                  </div>
                  <span className="w-16 text-right text-xs text-zinc-600">
                    0 games
                  </span>
                </div>
              );
            }

            return (
              <div key={pos} className="flex items-center gap-3">
                <span className="w-16 text-xs font-semibold text-zinc-300">
                  {POSITION_LABELS[pos]}
                </span>
                <div className="flex-1">
                  <WinrateBar
                    wins={role.wins}
                    losses={role.losses}
                    showLabel={false}
                  />
                </div>
                <span className="w-20 text-right text-xs text-zinc-400">
                  {formatWinrate(role.winrate)}
                </span>
                <span className="w-16 text-right text-xs text-zinc-500">
                  {role.games}G
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
