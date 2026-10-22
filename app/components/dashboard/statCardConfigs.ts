import {
  Activity,
  Building2,
  Coins,
  Crown,
  Crosshair,
  Eye,
  Flame,
  Ghost,
  Heart,
  Shield,
  Skull,
  Sword,
  Swords,
  Target,
  TrendingUp,
  Wheat,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { RankedEntry, StatCategory } from "@/app/types/riot";
import { formatKda, formatNumber, formatSigned, formatWinrate } from "@/app/lib/format";

export interface CardConfig {
  key: StatCategory;
  label: string;
  /** Label when the card ranks the worst instead of the best */
  worstLabel: string;
  icon: LucideIcon;
  format: (entry: RankedEntry) => string;
  sublabel: (entry: RankedEntry) => string;
}

const games = (e: RankedEntry) => `${e.games} games`;
const gamesNoSupp = (e: RankedEntry) => `${e.games} games · no supp`;

/** Superlatives shown in "Best / Worst of the challenge", in display order. */
export const CARD_CONFIGS: CardConfig[] = [
  { key: "winrate", label: "Top winrate", worstLabel: "Lowest winrate", icon: Crown, format: (e) => formatWinrate(e.value), sublabel: games },
  { key: "kda", label: "Top KDA", worstLabel: "Lowest KDA", icon: Crosshair, format: (e) => formatKda(e.value), sublabel: games },
  { key: "cirAvg", label: "Avg CIR", worstLabel: "Lowest avg CIR", icon: Activity, format: (e) => e.value.toFixed(1), sublabel: games },
  {
    key: "bestChampion",
    label: "Best champion",
    worstLabel: "Worst champion",
    icon: Swords,
    format: (e) => e.extra ?? "—",
    sublabel: (e) => `${e.extra2 ?? ""} · ${formatSigned(e.value)}`,
  },
  { key: "dmgPerMin", label: "DMG / min", worstLabel: "Lowest DMG / min", icon: Zap, format: (e) => formatNumber(e.value), sublabel: gamesNoSupp },
  { key: "csPerMin", label: "CS / min", worstLabel: "Lowest CS / min", icon: Wheat, format: (e) => e.value.toFixed(1), sublabel: gamesNoSupp },
  { key: "goldPerMin", label: "Gold / min", worstLabel: "Lowest gold / min", icon: Coins, format: (e) => formatNumber(e.value), sublabel: gamesNoSupp },
  { key: "killParticipation", label: "Kill participation", worstLabel: "Lowest KP", icon: Target, format: (e) => `${e.value.toFixed(1)}%`, sublabel: games },
  { key: "kills", label: "Avg kills", worstLabel: "Fewest kills", icon: Skull, format: (e) => e.value.toFixed(1), sublabel: games },
  { key: "deaths", label: "Fewest deaths", worstLabel: "Most deaths", icon: Shield, format: (e) => e.value.toFixed(1), sublabel: games },
  { key: "assists", label: "Avg assists", worstLabel: "Fewest assists", icon: Heart, format: (e) => e.value.toFixed(1), sublabel: games },
  { key: "vision", label: "Vision / min", worstLabel: "Lowest vision / min", icon: Eye, format: (e) => e.value.toFixed(2), sublabel: games },
  { key: "firstBloodParticipation", label: "First blood %", worstLabel: "Lowest first blood %", icon: Flame, format: (e) => `${e.value.toFixed(1)}%`, sublabel: games },
  { key: "dmgToBuildings", label: "Building DMG", worstLabel: "Lowest building DMG", icon: Building2, format: (e) => formatNumber(e.value), sublabel: gamesNoSupp },
  { key: "dmgToObjectives", label: "Objective DMG", worstLabel: "Lowest objective DMG", icon: Ghost, format: (e) => formatNumber(e.value), sublabel: gamesNoSupp },
  { key: "goldLead", label: "Lane gold lead", worstLabel: "Worst lane gold lead", icon: TrendingUp, format: (e) => formatSigned(e.value), sublabel: games },
  { key: "dmgLead", label: "Lane DMG lead", worstLabel: "Worst lane DMG lead", icon: Sword, format: (e) => formatSigned(e.value), sublabel: games },
];
