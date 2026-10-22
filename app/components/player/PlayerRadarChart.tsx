import { Radar } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import { deriveAxes, derivePlaystyle } from "@/app/lib/playstyle";
import { PlayerAggregatedStats } from "@/app/types/riot";

const SIZE = 240;
const C = SIZE / 2;
const R_MAX = 80;
const RINGS = [0.25, 0.5, 0.75, 1];

/** Polar → cartesian; angle 0 is straight up, clockwise. */
function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

function ring(n: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const p = polar(r, (360 / n) * i);
    return `${p.x},${p.y}`;
  }).join(" ");
}

/** Four-axis playstyle radar and the archetype it reads as. */
export default function PlayerRadarChart({ stats }: { stats: PlayerAggregatedStats }) {
  const axes = deriveAxes(stats);
  const { label, desc } = derivePlaystyle(axes);
  const step = 360 / axes.length;
  const shape = axes
    .map((a, i) => {
      const p = polar((a.value / 100) * R_MAX, i * step);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <Panel>
      <PanelHeader icon={Radar} title="Playstyle" description="Aligned with the CIR pillars" />
      <div className="flex flex-col items-center gap-3 p-5">
        <svg viewBox={`-40 0 ${SIZE + 80} ${SIZE}`} width={SIZE + 80} height={SIZE} className="max-w-full overflow-visible" role="img" aria-label={`Playstyle: ${label}`}>
          {RINGS.map((f) => (
            <polygon
              key={f}
              points={ring(axes.length, R_MAX * f)}
              fill="none"
              stroke="var(--border-strong)"
              strokeDasharray={f < 1 ? "3 4" : undefined}
            />
          ))}
          {axes.map((_, i) => {
            const end = polar(R_MAX, i * step);
            return <line key={i} x1={C} y1={C} x2={end.x} y2={end.y} stroke="var(--border)" />;
          })}
          <polygon points={shape} fill="var(--primary)" fillOpacity={0.16} stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />
          {axes.map((a, i) => {
            const p = polar((a.value / 100) * R_MAX, i * step);
            return <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--primary)" stroke="var(--card)" strokeWidth={2} />;
          })}
          {axes.map((a, i) => {
            const angle = i * step;
            const p = polar(R_MAX + 24, angle);
            const baseline = angle === 0 ? "auto" : angle === 180 ? "hanging" : "middle";
            return (
              <text
                key={a.label}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline={baseline}
                className="fill-muted-foreground font-display text-[9px] font-semibold tracking-wider"
              >
                {a.label}
                <tspan className="fill-primary" dx={4}>
                  {a.value}
                </tspan>
              </text>
            );
          })}
        </svg>
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 max-w-60 text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <table className="sr-only">
        <tbody>
          {axes.map((a) => (
            <tr key={a.label}>
              <th>{a.label}</th>
              <td>{a.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
