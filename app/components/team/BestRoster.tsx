import type { CirRoleEntry } from "@/app/lib/db";
import { POSITION_LABELS } from "@/app/data/constants";
import { cn } from "@/app/lib/utils";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { cirLabel } from "@/app/components/records/RecordData";
import { Users } from "lucide-react";
import { useMemo } from "react";

type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";
const ROLES: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

const ROLE_ICONS: Record<Position, string> = {
  TOP: "🛡️",
  JUNGLE: "🌿",
  MIDDLE: "⚡",
  BOTTOM: "🏹",
  UTILITY: "💠",
};

interface BestRosterProps {
  entries: CirRoleEntry[];
  players: { gameName: string; profileIconId: number | null }[];
  version: string;
}

export default function BestRoster({
  entries,
  players,
  version,
}: BestRosterProps) {
  const iconMap = new Map(players.map((p) => [p.gameName, p.profileIconId]));

  const bestRoster = useMemo(() => {
    // 1. Organize candidates by role
    const candidatesByRole = ROLES.map((role) => ({
      role,
      candidates: entries
        .filter((e) => e.position === role && e.games >= 3)
        .sort((a, b) => b.avgCir - a.avgCir),
    }));

    let maxTotalCir = -1;
    const optimalAssignment: Record<string, CirRoleEntry | null> = {};

    // 2. Recursive solver to find the global maximum
    function solve(
      roleIdx: number,
      currentTotal: number,
      currentMap: Map<string, CirRoleEntry>,
      usedNames: Set<string>,
    ) {
      // Base Case: All roles considered
      if (roleIdx === ROLES.length) {
        if (currentTotal > maxTotalCir) {
          maxTotalCir = currentTotal;
          // Map back to role names
          ROLES.forEach((r) => {
            optimalAssignment[r] = currentMap.get(r) || null;
          });
        }
        return;
      }

      const role = ROLES[roleIdx];
      const roleData = candidatesByRole[roleIdx];

      // Option A: Assign a player to this role
      let branched = false;
      for (const candidate of roleData.candidates) {
        if (!usedNames.has(candidate.gameName)) {
          usedNames.add(candidate.gameName);
          currentMap.set(role, candidate);

          solve(
            roleIdx + 1,
            currentTotal + candidate.avgCir,
            currentMap,
            usedNames,
          );

          // Backtrack
          usedNames.delete(candidate.gameName);
          currentMap.delete(role);
          branched = true;
        }
      }

      // Option B: Leave role empty (if no players available or all used elsewhere)
      if (!branched) {
        solve(roleIdx + 1, currentTotal, currentMap, usedNames);
      }
    }

    solve(0, 0, new Map(), new Set());

    return ROLES.map((role) => ({
      role,
      best: optimalAssignment[role] ?? null,
    }));
  }, [entries]);

  const hasData = bestRoster.some((r) => r.best !== null);

  if (!hasData) return null;

  const avgTeamCir =
    bestRoster
      .filter((r) => r.best)
      .reduce((s, r) => s + (r.best?.avgCir ?? 0), 0) /
    bestRoster.filter((r) => r.best).length;

  return (
    <div>
      <h2 className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          Best Roster
        </div>
        <span className="text-xs font-normal text-zinc-600">
          AVG CIR - min 3 games
        </span>
      </h2>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800/50">
        {bestRoster.map(({ role, best }) => {
          if (!best) {
            return (
              <div
                key={role}
                className="flex items-center gap-4 px-4 py-3 opacity-40"
              >
                <span className="w-6 text-center text-base">
                  {ROLE_ICONS[role]}
                </span>
                <span className="w-16 text-xs font-semibold text-zinc-500 shrink-0">
                  {POSITION_LABELS[role]}
                </span>
                <span className="flex-1 text-xs text-zinc-700 italic">
                  No data yet
                </span>
              </div>
            );
          }

          const { color, label } = cirLabel(best.avgCir);

          return (
            <div
              key={role}
              className="flex items-center gap-2 md:gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors"
            >
              <span className="w-6 text-center text-base shrink-0">
                {ROLE_ICONS[role]}
              </span>
              <span className="w-16 text-xs font-semibold text-zinc-500 shrink-0">
                {POSITION_LABELS[role]}
              </span>
              <ProfileIcon
                iconId={iconMap.get(best.gameName) ?? null}
                version={version}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-200 truncate">
                  {best.gameName}
                </div>
                <div className="text-xs text-zinc-600">{best.games} games</div>
              </div>
              <div className="text-right shrink-0">
                <div className={cn("text-base font-bold tabular-nums", color)}>
                  {best.avgCir.toFixed(1)}
                </div>
                <div className={cn("text-[10px] font-medium", color)}>
                  {label}
                </div>
              </div>
            </div>
          );
        })}

        {/* Team avg CIR footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Team Avg CIR
          </span>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              cirLabel(avgTeamCir).color,
            )}
          >
            {avgTeamCir.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
