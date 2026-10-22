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

export interface StatConfig {
  icon: React.ReactNode;
  label: string;
  getValue: (stats: PlayerAggregatedStats) => string;
  getColor: (stats: PlayerAggregatedStats) => string;
}

export interface SectionConfig {
  title: string;
  stats: StatConfig[];
}

const signFmt = (v: number) =>
  `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}`;

export const STAT_SECTIONS: SectionConfig[] = [
  {
    title: "Combat",
    stats: [
      {
        icon: <Crosshair className="size-3.5" />,
        label: "Avg KDA",
        getValue: (s) => formatKda(s.avgKda),
        getColor: (s) =>
          s.avgKda >= 3
            ? "text-win"
            : s.avgKda < 2
              ? "text-loss"
              : "text-foreground",
      },
      {
        icon: <Skull className="size-3.5" />,
        label: "Avg Kills",
        getValue: (s) => s.avgKills.toFixed(1),
        getColor: (s) =>
          s.avgKills < 5
            ? "text-loss"
            : s.avgKills > 8
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Heart className="size-3.5" />,
        label: "Avg Assists",
        getValue: (s) => s.avgAssists.toFixed(1),
        getColor: (s) =>
          s.avgAssists < 7
            ? "text-loss"
            : s.avgAssists > 10
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Shield className="size-3.5" />,
        label: "Avg Deaths",
        getValue: (s) => s.avgDeaths.toFixed(1),
        getColor: (s) =>
          s.avgDeaths > 7
            ? "text-loss"
            : s.avgDeaths < 5
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Target className="size-3.5" />,
        label: "Kill Participation",
        getValue: (s) => `${s.avgKillParticipation.toFixed(1)}%`,
        getColor: (s) =>
          s.avgKillParticipation < 25
            ? "text-loss"
            : s.avgKillParticipation > 40
              ? "text-win"
              : "text-foreground",
      },
    ],
  },
  {
    title: "Economy",
    stats: [
      {
        icon: <Wheat className="size-3.5" />,
        label: "CS / min",
        getValue: (s) => s.avgCsPerMinNoSupp.toFixed(1),
        getColor: (s) =>
          s.avgCsPerMinNoSupp < 6
            ? "text-loss"
            : s.avgCsPerMinNoSupp > 8
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Coins className="size-3.5" />,
        label: "Gold / min",
        getValue: (s) => s.avgGoldPerMinNoSupp.toFixed(0),
        getColor: (s) =>
          s.avgGoldPerMinNoSupp < 320
            ? "text-loss"
            : s.avgGoldPerMinNoSupp > 420
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <TrendingUp className="size-3.5" />,
        label: "Avg Gold Lead",
        getValue: (s) => signFmt(s.avgGoldLead),
        getColor: (s) =>
          s.avgGoldLead >= 500
            ? "text-win"
            : s.avgGoldLead <= -500
              ? "text-loss"
              : "text-foreground",
      },
      {
        icon: <Sword className="size-3.5" />,
        label: "Avg DMG Lead",
        getValue: (s) => signFmt(s.avgDmgLead),
        getColor: (s) =>
          s.avgDmgLead >= 1000
            ? "text-win"
            : s.avgDmgLead <= -1000
              ? "text-loss"
              : "text-foreground",
      },
      {
        icon: <Zap className="size-3.5" />,
        label: "DMG / min",
        getValue: (s) => Math.round(s.avgDmgPerMinNoSupp).toLocaleString(),
        getColor: (s) =>
          s.avgDmgPerMinNoSupp < 600
            ? "text-loss"
            : s.avgDmgPerMinNoSupp > 900
              ? "text-win"
              : "text-foreground",
      },
    ],
  },
  {
    title: "Utility & Map",
    stats: [
      {
        icon: <Eye className="size-3.5" />,
        label: "Vision / min",
        getValue: (s) => s.avgVisionScore.toFixed(2),
        getColor: (s) =>
          s.avgVisionScore < 1
            ? "text-loss"
            : s.avgVisionScore > 1.75
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Flame className="size-3.5" />,
        label: "First Blood %",
        getValue: (s) => `${s.firstBloodParticipation.toFixed(1)}%`,
        getColor: (s) =>
          s.firstBloodParticipation < 14
            ? "text-loss"
            : s.firstBloodParticipation > 18
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Ghost className="size-3.5" />,
        label: "Obj DMG",
        getValue: (s) => Math.round(s.avgDmgToObjectives).toLocaleString(),
        getColor: (s) =>
          s.avgDmgToObjectives < 15000
            ? "text-loss"
            : s.avgDmgToObjectives > 17500
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Building2 className="size-3.5" />,
        label: "Building DMG",
        getValue: (s) => Math.round(s.avgDmgToBuildings).toLocaleString(),
        getColor: (s) =>
          s.avgDmgToBuildings < 6000
            ? "text-loss"
            : s.avgDmgToBuildings > 7500
              ? "text-win"
              : "text-foreground",
      },
      {
        icon: <Activity className="size-3.5" />,
        label: "Avg CIR",
        getValue: (s) => s.avgCir.toFixed(1),
        getColor: (s) => getCirColor(s.avgCir),
      },
    ],
  },
];
