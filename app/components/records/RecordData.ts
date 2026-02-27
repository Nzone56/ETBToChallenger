import { MatchRecord } from "@/app/lib/db";

export const BEST_ORDER = [
  "Most Kills",
  "Most Assists",
  "Highest DMG/min",
  "Highest Gold/min",
  "Highest CS/min",
  "Highest Gold Lead",
  "Highest DMG Lead",
];

export const WORST_ORDER = [
  "Most Deaths",
  "Lowest DMG/min",
  "Lowest Gold/min",
  "Lowest CS/min",
  "Lowest Gold Lead",
  "Lowest DMG Lead",
];

export const CIR_TABS = [
  { key: "Top CIR", label: "Overall" },
  { key: "Top CIR TOP", label: "Top" },
  { key: "Top CIR JUNGLE", label: "Jungle" },
  { key: "Top CIR MIDDLE", label: "Mid" },
  { key: "Top CIR BOTTOM", label: "ADC" },
  { key: "Top CIR UTILITY", label: "Support" },
] as const;

export const WORST_CIR_TABS = [
  { key: "Worst CIR", label: "Overall" },
  { key: "Worst CIR TOP", label: "Top" },
  { key: "Worst CIR JUNGLE", label: "Jungle" },
  { key: "Worst CIR MIDDLE", label: "Mid" },
  { key: "Worst CIR BOTTOM", label: "ADC" },
  { key: "Worst CIR UTILITY", label: "Support" },
] as const;

export const POSITION_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

export function cirLabel(score: number): { label: string; color: string } {
  if (score >= 20) return { label: "Legendary", color: "text-yellow-300" };
  if (score >= 15) return { label: "Dominant", color: "text-orange-300" };
  if (score >= 11) return { label: "Great", color: "text-emerald-300" };
  if (score >= 8) return { label: "Good", color: "text-sky-300" };
  if (score >= 6) return { label: "Average", color: "text-zinc-300" };
  return { label: "Poor", color: "text-red-400" };
}

export const PILLARS = [
  {
    key: "combat",
    label: "CMB",
    dotColor: "bg-red-500",
    textColor: "text-red-400",
  },
  {
    key: "utility",
    label: "UTL",
    dotColor: "bg-sky-500",
    textColor: "text-sky-400",
  },
  {
    key: "economy",
    label: "ECO",
    dotColor: "bg-yellow-500",
    textColor: "text-yellow-400",
  },
  {
    key: "pressure",
    label: "PRS",
    dotColor: "bg-purple-500",
    textColor: "text-purple-400",
  },
] as const;

export const RAW_STATS: {
  key: keyof NonNullable<MatchRecord["cirStats"]>;
  label: string;
  format: (v: number) => string;
  pillar: "combat" | "utility" | "economy" | "pressure";
}[] = [
  {
    key: "killParticipation",
    label: "Kill Participation",
    format: (v) => `${v.toFixed(1)}%`,
    pillar: "combat",
  },
  {
    key: "dmgPerMin",
    label: "DMG / min",
    format: (v) => v.toFixed(0),
    pillar: "combat",
  },
  {
    key: "visionPerMin",
    label: "Vision / min",
    format: (v) => v.toFixed(2),
    pillar: "utility",
  },
  {
    key: "dmgToObjectives",
    label: "Obj. DMG",
    format: (v) => v.toLocaleString(),
    pillar: "utility",
  },
  {
    key: "firstBloodParticipation",
    label: "First Blood",
    format: (v) => (v > 0 ? "Yes" : "No"),
    pillar: "utility",
  },
  {
    key: "goldPerMin",
    label: "Gold / min",
    format: (v) => v.toFixed(0),
    pillar: "economy",
  },
  {
    key: "maxGameGoldPerMin",
    label: "Max GPM (game)",
    format: (v) => v.toFixed(0),
    pillar: "economy",
  },
  {
    key: "csPerMin",
    label: "CS / min",
    format: (v) => v.toFixed(2),
    pillar: "economy",
  },
  {
    key: "goldLead",
    label: "Gold Lead",
    format: (v) => (v >= 0 ? "+" : "") + v.toLocaleString(),
    pillar: "economy",
  },
  {
    key: "teamDamagePercent",
    label: "Team DMG %",
    format: (v) => `${v.toFixed(1)}%`,
    pillar: "pressure",
  },
  {
    key: "dmgPerMin",
    label: "DMG / min",
    format: (v) => v.toFixed(0),
    pillar: "pressure",
  },
  {
    key: "dmgToBuildings",
    label: "Structure DMG",
    format: (v) => v.toLocaleString(),
    pillar: "pressure",
  },
  {
    key: "dmgLead",
    label: "DMG Lead",
    format: (v) => (v >= 0 ? "+" : "") + v.toLocaleString(),
    pillar: "pressure",
  },
];
