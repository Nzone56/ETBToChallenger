"use client";

import { useMemo } from "react";
import { PlayerAggregatedStats } from "@/app/types/riot";

interface Axis {
  label: string;
  value: number; // 0–100 normalised
}

interface PlayerRadarChartProps {
  stats: PlayerAggregatedStats;
}

/** Clamp x into [0,1] */
function clamp(x: number, min: number, max: number) {
  return Math.max(0, Math.min(1, (x - min) / (max - min)));
}

/** Derive 0-100 axis scores from raw aggregated stats, aligned with CIR v3 pillars */
function deriveAxes(stats: PlayerAggregatedStats): Axis[] {
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

function derivePlaystyle(axes: Axis[]): { label: string; desc: string } {
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

/** Convert polar to cartesian. angle=0 is top, clockwise. */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_MAX = 75;
const R_RINGS = [0.25, 0.5, 0.75, 1];

export default function PlayerRadarChart({ stats }: PlayerRadarChartProps) {
  const axes = useMemo(() => deriveAxes(stats), [stats]);
  const n = axes.length;
  const angleStep = 360 / n;
  const { label, desc } = useMemo(() => derivePlaystyle(axes), [axes]);

  const spokeEnds = axes.map((_, i) => polar(CX, CY, R_MAX, i * angleStep));

  const polyPoints = axes
    .map((axis, i) => {
      const r = (axis.value / 100) * R_MAX;
      const pt = polar(CX, CY, r, i * angleStep);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="overflow-visible"
      >
        {/* Ring lines */}
        {R_RINGS.map((frac) => {
          const pts = axes
            .map((_, i) => {
              const pt = polar(CX, CY, R_MAX * frac, i * angleStep);
              return `${pt.x},${pt.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={frac}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
              strokeDasharray={frac < 1 ? "3 3" : "none"}
            />
          );
        })}

        {/* Spokes */}
        {spokeEnds.map((end, i) => (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={polyPoints}
          fill="rgba(20,184,166,0.18)"
          stroke="rgba(20,184,166,0.7)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {axes.map((axis, i) => {
          const r = (axis.value / 100) * R_MAX;
          const pt = polar(CX, CY, r, i * angleStep);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3"
              fill="rgb(20,184,166)"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1"
            />
          );
        })}

        {/* Center glow */}
        <circle cx={CX} cy={CY} r="6" fill="rgba(20,184,166,0.3)" />

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const labelR = R_MAX + 22;
          const pt = polar(CX, CY, labelR, i * angleStep);
          // Adjust vertical alignment for top/bottom labels
          const angle = i * angleStep;
          let baseline: "middle" | "auto" | "hanging" = "middle";
          if (angle < 45 || angle > 315)
            baseline = "auto"; // top
          else if (angle > 135 && angle < 225) baseline = "hanging"; // bottom

          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline={baseline}
              fontSize="8"
              letterSpacing="0.08em"
              fill="rgba(161,161,170,0.9)"
              fontFamily="inherit"
              fontWeight="600"
            >
              {axis.label}
            </text>
          );
        })}

        {/* Axis score inside the dot */}
        {axes.map((axis, i) => {
          const r = (axis.value / 100) * R_MAX;
          const offset = polar(CX, CY, r + 10, i * angleStep);
          if (axis.value < 10) return null;
          return (
            <text
              key={`val-${i}`}
              x={offset.x}
              y={offset.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="rgba(20,184,166,0.9)"
              fontFamily="inherit"
              fontWeight="700"
            >
              {axis.value}
            </text>
          );
        })}
      </svg>

      {/* Playstyle label */}
      <div className="text-center">
        <p className="text-sm font-bold text-zinc-100">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500 max-w-45">{desc}</p>
      </div>
    </div>
  );
}
