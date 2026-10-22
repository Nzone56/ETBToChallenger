import type { CirRoleEntry } from "./db";
import type { Position } from "../types/riot";

const ROLES: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

/** Fewest games in a role for a player to be considered for it. */
export const BEST_ROSTER_MIN_GAMES = 3;

export interface RosterSlot {
  role: Position;
  pick: CirRoleEntry | null;
}

/**
 * The five-player lineup with the highest total average CIR, one player per
 * role, nobody twice. Exhaustive search — seven players and five roles is a
 * few thousand branches, so a greedy pick (which can strand a player's best
 * role) isn't worth the risk.
 */
export function solveBestRoster(entries: CirRoleEntry[]): RosterSlot[] {
  const candidates = ROLES.map((role) =>
    entries
      .filter((e) => e.position === role && e.games >= BEST_ROSTER_MIN_GAMES)
      .sort((a, b) => b.avgCir - a.avgCir),
  );

  let bestTotal = -1;
  let best: (CirRoleEntry | null)[] = ROLES.map(() => null);
  const current: (CirRoleEntry | null)[] = ROLES.map(() => null);
  const used = new Set<string>();

  function solve(i: number, total: number) {
    if (i === ROLES.length) {
      if (total > bestTotal) {
        bestTotal = total;
        best = [...current];
      }
      return;
    }
    let branched = false;
    for (const c of candidates[i]) {
      if (used.has(c.gameName)) continue;
      used.add(c.gameName);
      current[i] = c;
      solve(i + 1, total + c.avgCir);
      used.delete(c.gameName);
      current[i] = null;
      branched = true;
    }
    // Nobody available for this role: leave it empty and carry on.
    if (!branched) solve(i + 1, total);
  }

  solve(0, 0);
  return ROLES.map((role, i) => ({ role, pick: best[i] }));
}
