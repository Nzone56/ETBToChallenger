import { PlayerAggregatedStats } from "@/app/types/riot";
import { formatKda } from "@/app/lib/helpers";

import {
  Crosshair,
  Wheat,
  Zap,
  Coins,
  Eye,
  Target,
  Flame,
  Building2,
  Ghost,
  TrendingUp,
  Sword,
  Activity,
  Skull,
  Heart,
  Shield,
} from "lucide-react";
import { getCirColor } from "@/app/lib/cirUtils";

interface StatConfig {
  icon: React.ReactNode;
  label: string;
  getValue: (stats: PlayerAggregatedStats) => string;
  getColor: (stats: PlayerAggregatedStats) => string;
}

interface SectionConfig {
  title: string;
  stats: StatConfig[];
}

const signFmt = (v: number) =>
  `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}`;

const STAT_SECTIONS: SectionConfig[] = [
  {
    title: "Combat",
    stats: [
      {
        icon: <Crosshair className="h-3.5 w-3.5" />,
        label: "Avg KDA",
        getValue: (s) => formatKda(s.avgKda),
        getColor: (s) =>
          s.avgKda >= 3
            ? "text-emerald-400"
            : s.avgKda < 2
              ? "text-red-400"
              : "text-zinc-100",
      },
      {
        icon: <Skull className="h-3.5 w-3.5" />,
        label: "Avg Kills",
        getValue: (s) => s.avgKills.toFixed(1),
        getColor: (s) =>
          s.avgKills < 5
            ? "text-red-400"
            : s.avgKills > 8
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Heart className="h-3.5 w-3.5" />,
        label: "Avg Assists",
        getValue: (s) => s.avgAssists.toFixed(1),
        getColor: (s) =>
          s.avgAssists < 7
            ? "text-red-400"
            : s.avgAssists > 10
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Shield className="h-3.5 w-3.5" />,
        label: "Avg Deaths",
        getValue: (s) => s.avgDeaths.toFixed(1),
        getColor: (s) =>
          s.avgDeaths > 7
            ? "text-red-400"
            : s.avgDeaths < 5
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Target className="h-3.5 w-3.5" />,
        label: "Kill Participation",
        getValue: (s) => `${s.avgKillParticipation.toFixed(1)}%`,
        getColor: (s) =>
          s.avgKillParticipation < 25
            ? "text-red-400"
            : s.avgKillParticipation > 40
              ? "text-emerald-400"
              : "text-zinc-100",
      },
    ],
  },
  {
    title: "Economy",
    stats: [
      {
        icon: <Wheat className="h-3.5 w-3.5" />,
        label: "CS / min",
        getValue: (s) => s.avgCsPerMinNoSupp.toFixed(1),
        getColor: (s) =>
          s.avgCsPerMinNoSupp < 6
            ? "text-red-400"
            : s.avgCsPerMinNoSupp > 8
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Coins className="h-3.5 w-3.5" />,
        label: "Gold / min",
        getValue: (s) => s.avgGoldPerMinNoSupp.toFixed(0),
        getColor: (s) =>
          s.avgGoldPerMinNoSupp < 320
            ? "text-red-400"
            : s.avgGoldPerMinNoSupp > 420
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        label: "Avg Gold Lead",
        getValue: (s) => signFmt(s.avgGoldLead),
        getColor: (s) =>
          s.avgGoldLead >= 500
            ? "text-emerald-400"
            : s.avgGoldLead <= -500
              ? "text-red-400"
              : "text-zinc-100",
      },
      {
        icon: <Sword className="h-3.5 w-3.5" />,
        label: "Avg DMG Lead",
        getValue: (s) => signFmt(s.avgDmgLead),
        getColor: (s) =>
          s.avgDmgLead >= 1000
            ? "text-emerald-400"
            : s.avgDmgLead <= -1000
              ? "text-red-400"
              : "text-zinc-100",
      },
      {
        icon: <Zap className="h-3.5 w-3.5" />,
        label: "DMG / min",
        getValue: (s) => Math.round(s.avgDmgPerMinNoSupp).toLocaleString(),
        getColor: (s) =>
          s.avgDmgPerMinNoSupp < 600
            ? "text-red-400"
            : s.avgDmgPerMinNoSupp > 900
              ? "text-emerald-400"
              : "text-zinc-100",
      },
    ],
  },
  {
    title: "Utility & Map",
    stats: [
      {
        icon: <Eye className="h-3.5 w-3.5" />,
        label: "Vision / min",
        getValue: (s) => s.avgVisionScore.toFixed(2),
        getColor: (s) =>
          s.avgVisionScore < 1
            ? "text-red-400"
            : s.avgVisionScore > 1.75
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Flame className="h-3.5 w-3.5" />,
        label: "First Blood %",
        getValue: (s) => `${s.firstBloodParticipation.toFixed(1)}%`,
        getColor: (s) =>
          s.firstBloodParticipation < 14
            ? "text-red-400"
            : s.firstBloodParticipation > 18
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Ghost className="h-3.5 w-3.5" />,
        label: "Obj DMG",
        getValue: (s) => Math.round(s.avgDmgToObjectives).toLocaleString(),
        getColor: (s) =>
          s.avgDmgToObjectives < 15000
            ? "text-red-400"
            : s.avgDmgToObjectives > 17500
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Building2 className="h-3.5 w-3.5" />,
        label: "Building DMG",
        getValue: (s) => Math.round(s.avgDmgToBuildings).toLocaleString(),
        getColor: (s) =>
          s.avgDmgToBuildings < 6000
            ? "text-red-400"
            : s.avgDmgToBuildings > 7500
              ? "text-emerald-400"
              : "text-zinc-100",
      },
      {
        icon: <Activity className="h-3.5 w-3.5" />,
        label: "Avg CIR",
        getValue: (s) => s.avgCir.toFixed(1),
        getColor: (s) => getCirColor(s.avgCir),
      },
    ],
  },
];

interface PlayerStatsGridProps {
  stats: PlayerAggregatedStats;
}

export default function PlayerStatsGrid({ stats }: PlayerStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {STAT_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm"
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            {section.title}
          </p>
          {section.stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 py-2 border-b border-zinc-800/50 last:border-0"
            >
              <div className="flex items-center gap-2 text-zinc-500">
                {stat.icon}
                <span className="text-xs">{stat.label}</span>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-semibold tabular-nums ${stat.getColor(stats)}`}
                >
                  {stat.getValue(stats)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
