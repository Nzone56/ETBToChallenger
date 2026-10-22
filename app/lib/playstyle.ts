import type { PlayerAggregatedStats } from "../types/riot";

// Playstyle radar: four 0–100 axes derived from season averages, aligned with
// the CIR v3 pillars, plus a one-line archetype read off those axes.

export interface Axis {
  label: string;
  value: number; // 0–100 normalised
}

/** Clamp x into [0,1] */
function clamp(x: number, min: number, max: number) {
  return Math.max(0, Math.min(1, (x - min) / (max - min)));
}

/** Derive 0-100 axis scores from raw aggregated stats, aligned with CIR v3 pillars */
export function deriveAxes(stats: PlayerAggregatedStats): Axis[] {
  // COMBAT: KDA + damage output (aligned with CIR v3 combat pillar)
  // CIR combat = kda_factor * (0.5 + kp) + dmgPerMin/190
  const combat =
    clamp(stats.avgKda, 0, 6) * 0.4 +
    clamp(stats.avgKillParticipation, 20, 80) * 0.3 +
    clamp(stats.avgDmgPerMin, 200, 1000) * 0.3;

  // UTILITY: Vision + objectives + kill participation (aligned with CIR v3 utility pillar)
  // CIR utility = visionPerMin * 3 + dmgToObjectives/70000 + FB bonus + kp*5
  const utility =
    clamp(stats.avgVisionScore, 0.2, 1.8) * 0.4 +
    clamp(stats.avgDmgToObjectives, 0, 20000) * 0.3 +
    clamp(stats.avgKillParticipation, 20, 80) * 0.2 +
    clamp(stats.firstBloodParticipation, 0, 50) * 0.1;

  // ECONOMY: GPM + CS + gold lead (aligned with CIR v3 economy pillar)
  // CIR economy = (gpm/maxGPM)*10 + csPerMin*0.8 + goldLead/600
  const economy =
    clamp(stats.avgGoldPerMinNoSupp || stats.avgGoldPerMin, 250, 550) * 0.45 +
    clamp(stats.avgCsPerMinNoSupp || stats.avgCsPerMin, 3, 10) * 0.35 +
    clamp(stats.avgGoldLead + 3000, 0, 6000) * 0.2;

  // PRESSURE: Team damage share + structure damage + map pressure (aligned with CIR v3 pressure pillar)
  // CIR pressure = teamDmgPct/3 + dmgToBuildings/5000 + (gpm/maxGPM)*5 + dmgPerMin/300 + dmgLead/1000
  const pressure =
    clamp(stats.avgDmgPerMinNoSupp || stats.avgDmgPerMin, 300, 1000) * 0.4 +
    clamp(stats.avgDmgToBuildings, 0, 10000) * 0.3 +
    clamp(stats.avgGoldPerMinNoSupp || stats.avgGoldPerMin, 250, 550) * 0.2 +
    clamp(stats.avgDmgLead + 5000, 0, 10000) * 0.1;

  return [
    { label: "COMBAT", value: Math.round(combat * 100) },
    { label: "UTILITY", value: Math.round(utility * 100) },
    { label: "ECONOMY", value: Math.round(economy * 100) },
    { label: "PRESSURE", value: Math.round(pressure * 100) },
  ];
}

export function derivePlaystyle(axes: Axis[]): { label: string; desc: string } {
  const map = Object.fromEntries(axes.map((a) => [a.label, a.value]));
  const combat = map.COMBAT ?? 0;
  const utility = map.UTILITY ?? 0;
  const economy = map.ECONOMY ?? 0;
  const pressure = map.PRESSURE ?? 0;

  if (combat >= 70 && economy >= 65)
    return {
      label: "Carry Specialist",
      desc: "High combat output with efficient resource usage.",
    };
  if (combat >= 70 && pressure >= 65)
    return {
      label: "Aggressive Playmaker",
      desc: "High damage with strong map pressure and structure damage.",
    };
  if (utility >= 70 && pressure >= 60)
    return {
      label: "Support Anchor",
      desc: "Strong vision control and team enablement.",
    };
  if (economy >= 75)
    return {
      label: "Resource Engine",
      desc: "Excellent farm and gold efficiency across all games.",
    };
  if (utility >= 65)
    return {
      label: "Team Player",
      desc: "High kill participation and objective contribution.",
    };
  if (pressure >= 70)
    return {
      label: "Map Dominator",
      desc: "Strong structure damage and team damage share.",
    };
  if (combat >= 65)
    return {
      label: "Combat Focused",
      desc: "High KDA and damage output in teamfights.",
    };
  return {
    label: "Balanced Competitor",
    desc: "Well-rounded performance across all CIR pillars.",
  };
}

