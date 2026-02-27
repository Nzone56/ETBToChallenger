import { RankedEntry, StatCategory } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import {
  Crown,
  Crosshair,
  Zap,
  Swords,
  Skull,
  Heart,
  Shield,
  Target,
  Coins,
  Wheat,
  Eye,
  Flame,
  Building2,
  Ghost,
  TrendingUp,
  Sword,
  Activity,
} from "lucide-react";

export interface CardConfig {
  key: StatCategory;
  label: string;
  icon: React.ReactNode;
  format: (entry: RankedEntry) => string;
  sublabelFn: (entry: RankedEntry) => string;
  gradient: string;
  border: string;
}

export const CARD_CONFIGS: CardConfig[] = [
  {
    key: "winrate",
    label: "Top Winrate",
    icon: <Crown className="h-4 w-4 text-yellow-400" />,
    format: (e) => formatWinrate(e.value),
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-yellow-600/20 to-transparent",
    border: "border-yellow-700/30",
  },
  {
    key: "kda",
    label: "Top KDA",
    icon: <Crosshair className="h-4 w-4 text-emerald-400" />,
    format: (e) => `${formatKda(e.value)} KDA`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-emerald-600/20 to-transparent",
    border: "border-emerald-700/30",
  },
  {
    key: "dmgPerMin",
    label: "DMG/min (no supp)",
    icon: <Zap className="h-4 w-4 text-orange-400" />,
    format: (e) => `${Math.round(e.value).toLocaleString()}`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-orange-600/20 to-transparent",
    border: "border-orange-700/30",
  },
  {
    key: "csPerMin",
    label: "CS/min (no supp)",
    icon: <Wheat className="h-4 w-4 text-lime-400" />,
    format: (e) => `${e.value.toFixed(1)}`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-lime-600/20 to-transparent",
    border: "border-lime-700/30",
  },
  {
    key: "goldPerMin",
    label: "Gold/min (no supp)",
    icon: <Coins className="h-4 w-4 text-amber-400" />,
    format: (e) => `${Math.round(e.value).toLocaleString()}`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-amber-600/20 to-transparent",
    border: "border-amber-700/30",
  },
  {
    key: "bestChampion",
    label: "Best Champ",
    icon: <Swords className="h-4 w-4 text-purple-400" />,
    format: (e) => e.extra ?? "—",
    sublabelFn: (e) => {
      const sign = e.value > 0 ? "+" : "";
      return `${e.extra2 ?? ""} = ${sign}${e.value}`;
    },
    gradient: "from-purple-600/20 to-transparent",
    border: "border-purple-700/30",
  },
  {
    key: "kills",
    label: "Most Avg Kills",
    icon: <Skull className="h-4 w-4 text-red-400" />,
    format: (e) => `${e.value.toFixed(1)}/game`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-red-600/20 to-transparent",
    border: "border-red-700/30",
  },
  {
    key: "deaths",
    label: "Least Avg Deaths",
    icon: <Shield className="h-4 w-4 text-sky-400" />,
    format: (e) => `${e.value.toFixed(1)}/game`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-sky-600/20 to-transparent",
    border: "border-sky-700/30",
  },
  {
    key: "assists",
    label: "Most Avg Assists",
    icon: <Heart className="h-4 w-4 text-pink-400" />,
    format: (e) => `${e.value.toFixed(1)}/game`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-pink-600/20 to-transparent",
    border: "border-pink-700/30",
  },
  {
    key: "killParticipation",
    label: "Top Kill Participation",
    icon: <Target className="h-4 w-4 text-cyan-400" />,
    format: (e) => `${e.value.toFixed(1)}% KP`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-cyan-600/20 to-transparent",
    border: "border-cyan-700/30",
  },
  {
    key: "vision",
    label: "Vision/min",
    icon: <Eye className="h-4 w-4 text-violet-400" />,
    format: (e) => `${e.value.toFixed(2)}`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-violet-600/20 to-transparent",
    border: "border-violet-700/30",
  },
  {
    key: "firstBloodParticipation",
    label: "First Blood %",
    icon: <Flame className="h-4 w-4 text-fuchsia-400" />,
    format: (e) => `${e.value.toFixed(1)}%`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-fuchsia-600/20 to-transparent",
    border: "border-fuchsia-700/30",
  },
  {
    key: "dmgToBuildings",
    label: "DMG to Buildings (no supp)",
    icon: <Building2 className="h-4 w-4 text-stone-400" />,
    format: (e) => Math.round(e.value).toLocaleString(),
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-stone-600/20 to-transparent",
    border: "border-stone-700/30",
  },
  {
    key: "dmgToObjectives",
    label: "DMG to Objectives (no supp)",
    icon: <Ghost className="h-4 w-4 text-teal-400" />,
    format: (e) => Math.round(e.value).toLocaleString(),
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-teal-600/20 to-transparent",
    border: "border-teal-700/30",
  },
  {
    key: "goldLead",
    label: "Avg Gold Lead (lane)",
    icon: <TrendingUp className="h-4 w-4 text-green-400" />,
    format: (e) => {
      const sign = e.value >= 0 ? "+" : "";
      return `${sign}${Math.round(e.value).toLocaleString()}`;
    },
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-green-600/20 to-transparent",
    border: "border-green-700/30",
  },
  {
    key: "dmgLead",
    label: "Avg DMG Lead (lane)",
    icon: <Sword className="h-4 w-4 text-blue-400" />,
    format: (e) => {
      const sign = e.value >= 0 ? "+" : "";
      return `${sign}${Math.round(e.value).toLocaleString()}`;
    },
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-blue-600/20 to-transparent",
    border: "border-blue-700/30",
  },
  {
    key: "cirAvg",
    label: "Avg CIR",
    icon: <Activity className="h-4 w-4 text-amber-400" />,
    format: (e) => `${e.value.toFixed(1)}`,
    sublabelFn: (e) => `${e.games} games`,
    gradient: "from-amber-600/20 to-transparent",
    border: "border-amber-700/30",
  },
];

export const WORST_LABEL_OVERRIDES: Partial<Record<StatCategory, string>> = {
  winrate: "Lowest Winrate",
  kda: "Lowest KDA",
  dmgPerMin: "Lowest DMG/min (no supp)",
  csPerMin: "Lowest CS/min (no supp)",
  goldPerMin: "Lowest Gold/min (no supp)",
  bestChampion: "Worst Champ",
  kills: "Least Avg Kills",
  deaths: "Most Avg Deaths",
  assists: "Least Avg Assists",
  killParticipation: "Lowest KP",
  vision: "Lowest Vision/min",
  firstBloodParticipation: "Lowest First Blood %",
  dmgToBuildings: "Lowest DMG to Buildings",
  dmgToObjectives: "Lowest DMG to Objectives",
  goldLead: "Worst Gold Lead (lane)",
  dmgLead: "Worst DMG Lead (lane)",
  cirAvg: "Lowest Avg CIR",
};
