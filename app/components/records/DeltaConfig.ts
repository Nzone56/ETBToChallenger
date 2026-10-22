import { Anchor, Crown, TrendingDown, Zap, type LucideIcon } from "lucide-react";

export type DeltaType = "titan" | "king" | "anchor" | "gap";

export interface DeltaLeaderboardConfig {
  type: DeltaType;
  /** Category name as stored by getMatchRecords */
  categoryName: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  /** best: positive delta is the point. worst: the hall of shame. */
  tone: "best" | "worst";
  /** Compared against the team average or the lane opponent */
  against: "team" | "lane";
}

export const DELTA_LEADERBOARDS: Record<DeltaType, DeltaLeaderboardConfig> = {
  titan: {
    type: "titan",
    categoryName: "1vs9 GOAT",
    title: "The GOAT",
    subtitle: "1 vs 9",
    description: "Biggest CIR lead over their own team's average",
    icon: Crown,
    tone: "best",
    against: "team",
  },
  king: {
    type: "king",
    categoryName: "Lane Dominator King",
    title: "Lane King",
    subtitle: "Dominator",
    description: "Biggest CIR lead over the lane opponent",
    icon: Zap,
    tone: "best",
    against: "lane",
  },
  anchor: {
    type: "anchor",
    categoryName: "Dead Weight Anchor",
    title: "The Anchor",
    subtitle: "Dead weight",
    description: "Furthest below their own team's average CIR",
    icon: Anchor,
    tone: "worst",
    against: "team",
  },
  gap: {
    type: "gap",
    categoryName: "Diffed Gap",
    title: "The Hollow",
    subtitle: "Diffed",
    description: "Furthest below the lane opponent's CIR",
    icon: TrendingDown,
    tone: "worst",
    against: "lane",
  },
};

export const DELTA_LEADERBOARD_ORDER: DeltaType[] = ["titan", "king", "anchor", "gap"];
