import type { MatchRecord } from "@/app/lib/db";
import { CIR_LEGENDARY_MIN, CIR_POOR_BELOW } from "@/app/lib/cirUtils";
import type { Position } from "@/app/types/riot";

export const BEST_ORDER = [
  "Most Kills",
  "Most Assists",
  "Highest DMG/min",
  "Highest Gold/min",
  "Highest CS/min",
  "Highest Gold Lead",
  "Highest DMG Lead",
  "1vs9 GOAT",
  "Lane Dominator King",
];

export const WORST_ORDER = [
  "Most Deaths",
  "Lowest DMG/min",
  "Lowest Gold/min",
  "Lowest CS/min",
  "Lowest Gold Lead",
  "Lowest DMG Lead",
  "Dead Weight Anchor",
  "Diffed Gap",
];

/** CIR leaderboard scopes: overall, then one per role. */
export type CirScope = "ALL" | Position;

export function cirCategory(side: "top" | "worst", scope: CirScope): string {
  const base = side === "top" ? "Top CIR" : "Worst CIR";
  return scope === "ALL" ? base : `${base} ${scope}`;
}

export const PILLARS = [
  { key: "combat", label: "Combat", short: "CMB", dot: "bg-pillar-combat", text: "text-pillar-combat" },
  { key: "utility", label: "Utility", short: "UTL", dot: "bg-pillar-utility", text: "text-pillar-utility" },
  { key: "economy", label: "Economy", short: "ECO", dot: "bg-pillar-economy", text: "text-pillar-economy" },
  { key: "pressure", label: "Pressure", short: "PRS", dot: "bg-pillar-pressure", text: "text-pillar-pressure" },
] as const;

export const RAW_STATS: {
  key: keyof NonNullable<MatchRecord["cirStats"]>;
  label: string;
  format: (v: number) => string;
  pillar: "combat" | "utility" | "economy" | "pressure";
}[] = [
  { key: "killParticipation", label: "Kill participation", format: (v) => `${v.toFixed(1)}%`, pillar: "combat" },
  { key: "dmgPerMin", label: "DMG / min", format: (v) => v.toFixed(0), pillar: "combat" },
  { key: "visionPerMin", label: "Vision / min", format: (v) => v.toFixed(2), pillar: "utility" },
  { key: "dmgToObjectives", label: "Objective DMG", format: (v) => v.toLocaleString(), pillar: "utility" },
  { key: "firstBloodParticipation", label: "First blood", format: (v) => (v > 0 ? "Yes" : "No"), pillar: "utility" },
  { key: "goldPerMin", label: "Gold / min", format: (v) => v.toFixed(0), pillar: "economy" },
  { key: "maxGameGoldPerMin", label: "Max GPM (game)", format: (v) => v.toFixed(0), pillar: "economy" },
  { key: "csPerMin", label: "CS / min", format: (v) => v.toFixed(2), pillar: "economy" },
  { key: "goldLead", label: "Gold lead", format: (v) => (v >= 0 ? "+" : "") + v.toLocaleString(), pillar: "economy" },
  { key: "teamDamagePercent", label: "Team DMG %", format: (v) => `${v.toFixed(1)}%`, pillar: "pressure" },
  { key: "dmgPerMin", label: "DMG / min", format: (v) => v.toFixed(0), pillar: "pressure" },
  { key: "dmgToBuildings", label: "Structure DMG", format: (v) => v.toLocaleString(), pillar: "pressure" },
  { key: "dmgLead", label: "DMG lead", format: (v) => (v >= 0 ? "+" : "") + v.toLocaleString(), pillar: "pressure" },
];

/** Records grouped by category, each list in the order it arrived (top first). */
export function groupByCategory(records: MatchRecord[]): Map<string, MatchRecord[]> {
  const map = new Map<string, MatchRecord[]>();
  for (const r of records) {
    const list = map.get(r.category) ?? [];
    list.push(r);
    map.set(r.category, list);
  }
  return map;
}

const ROLE_SCOPES: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export interface CirCounts {
  topAppearances: [string, number][];
  legendary: [string, number][];
  worstAppearances: [string, number][];
  poor: [string, number][];
}

/**
 * How often each player lands in the per-role top/worst 15 lists, and how many
 * of those are legendary or poor games. Counted over role lists only — the
 * overall list would count the same game twice.
 */
export function countCirAppearances(byCategory: Map<string, MatchRecord[]>): CirCounts {
  const top = new Map<string, number>();
  const legendary = new Map<string, number>();
  const worst = new Map<string, number>();
  const poor = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  for (const role of ROLE_SCOPES) {
    for (const r of byCategory.get(cirCategory("top", role)) ?? []) {
      bump(top, r.gameName);
      if (r.value >= CIR_LEGENDARY_MIN) bump(legendary, r.gameName);
    }
    for (const r of byCategory.get(cirCategory("worst", role)) ?? []) {
      bump(worst, r.gameName);
      if (r.value < CIR_POOR_BELOW) bump(poor, r.gameName);
    }
  }

  const ranked = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return {
    topAppearances: ranked(top),
    legendary: ranked(legendary),
    worstAppearances: ranked(worst),
    poor: ranked(poor),
  };
}
