import { Crown, Zap, Anchor, TrendingDown, LucideIcon } from "lucide-react";

export interface DeltaLeaderboardConfig {
  key: string;
  categoryName: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  type: "titan" | "anchor" | "king" | "gap";
  theme: {
    gradient: string;
    border: string;
    glow: string;
    deltaColor: string;
    iconColor: string;
    rankBg: string;
    rankText: string;
    contextBg: string;
    contextText: string;
    titleColor: string;
  };
}

export const DELTA_LEADERBOARDS: Record<string, DeltaLeaderboardConfig> = {
  titan: {
    key: "titan",
    categoryName: "1vs9 GOAT",
    title: "The GOAT",
    subtitle: "1vs9",
    description: "Largest positive delta vs team average CIR",
    icon: Crown,
    iconColor: "text-yellow-400",
    type: "titan",
    theme: {
      gradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20",
      border: "border-yellow-500/40 hover:border-yellow-400/60",
      glow: "shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]",
      deltaColor: "text-yellow-300",
      iconColor: "text-yellow-400",
      rankBg: "bg-gradient-to-br from-yellow-500/30 to-amber-600/30",
      rankText: "text-yellow-200",
      contextBg: "bg-yellow-500/10 border-yellow-500/30",
      contextText: "text-yellow-200",
      titleColor: "text-yellow-300",
    },
  },
  king: {
    key: "king",
    categoryName: "Lane Dominator King",
    title: "Lane King",
    subtitle: "Dominator",
    description: "Largest positive delta vs lane opponent CIR",
    icon: Zap,
    iconColor: "text-cyan-400",
    type: "king",
    theme: {
      gradient: "from-cyan-500/20 via-blue-500/20 to-indigo-500/20",
      border: "border-cyan-500/40 hover:border-cyan-400/60",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
      deltaColor: "text-cyan-300",
      iconColor: "text-cyan-400",
      rankBg: "bg-gradient-to-br from-cyan-500/30 to-blue-600/30",
      rankText: "text-cyan-200",
      contextBg: "bg-cyan-500/10 border-cyan-500/30",
      contextText: "text-cyan-200",
      titleColor: "text-cyan-300",
    },
  },
  anchor: {
    key: "anchor",
    categoryName: "Dead Weight Anchor",
    title: "The Anchor",
    subtitle: "Dead Weight",
    description: "Largest negative delta vs team average CIR",
    icon: Anchor,
    iconColor: "text-red-500",
    type: "anchor",
    theme: {
      gradient: "from-zinc-800/40 via-red-900/20 to-zinc-900/40",
      border: "border-red-900/50 hover:border-red-800/60",
      glow: "shadow-[0_0_15px_rgba(127,29,29,0.4)] hover:shadow-[0_0_25px_rgba(127,29,29,0.6)]",
      deltaColor: "text-red-400",
      iconColor: "text-red-500",
      rankBg: "bg-gradient-to-br from-red-900/40 to-zinc-800/40",
      rankText: "text-red-300",
      contextBg: "bg-red-900/20 border-red-800/30",
      contextText: "text-red-300",
      titleColor: "text-red-300",
    },
  },
  gap: {
    key: "gap",
    categoryName: "Diffed Gap",
    title: "The Hollow",
    subtitle: "Diffed",
    description: "Largest negative delta vs lane opponent CIR",
    icon: TrendingDown,
    iconColor: "text-orange-500",
    type: "gap",
    theme: {
      gradient: "from-zinc-800/40 via-orange-900/20 to-zinc-900/40",
      border: "border-orange-900/50 hover:border-orange-800/60",
      glow: "shadow-[0_0_15px_rgba(124,45,18,0.4)] hover:shadow-[0_0_25px_rgba(124,45,18,0.6)]",
      deltaColor: "text-orange-400",
      iconColor: "text-orange-500",
      rankBg: "bg-gradient-to-br from-orange-900/40 to-zinc-800/40",
      rankText: "text-orange-300",
      contextBg: "bg-orange-900/20 border-orange-800/30",
      contextText: "text-orange-300",
      titleColor: "text-orange-300",
    },
  },
};

export const DELTA_LEADERBOARD_ORDER = [
  "titan",
  "king",
  "anchor",
  "gap",
] as const;
