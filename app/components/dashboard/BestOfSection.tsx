"use client";

import { useState } from "react";
import { BestOfChallenge, RankedEntry, StatCategory } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import { cn } from "@/app/lib/utils";
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
  ChevronDown,
  Flame,
  Building2,
  Ghost,
  TrendingUp,
  Sword,
} from "lucide-react";

interface CardConfig {
  key: StatCategory;
  label: string;
  icon: React.ReactNode;
  format: (entry: RankedEntry) => string;
  sublabelFn: (entry: RankedEntry) => string;
  gradient: string;
  border: string;
}

const CARD_CONFIGS: CardConfig[] = [
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
    label: "Vision/game",
    icon: <Eye className="h-4 w-4 text-violet-400" />,
    format: (e) => `${e.value.toFixed(1)}`,
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
];

// Worst-of overrides for labels that differ
const WORST_LABEL_OVERRIDES: Partial<Record<StatCategory, string>> = {
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
  vision: "Lowest Vision/game",
  firstBloodParticipation: "Lowest First Blood %",
  dmgToBuildings: "Lowest DMG to Buildings",
  dmgToObjectives: "Lowest DMG to Objectives",
  goldLead: "Worst Gold Lead (lane)",
  dmgLead: "Worst DMG Lead (lane)",
};

const MEDAL_COLORS = ["text-yellow-400", "text-zinc-400", "text-amber-700"];

function StatCard({
  config,
  entries,
  labelOverride,
}: {
  config: CardConfig;
  entries: RankedEntry[];
  labelOverride?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const first = entries[0];
  const rest = entries.slice(1);

  if (!first) {
    return (
      <div
        className={`rounded-xl border ${config.border} bg-linear-to-br ${config.gradient} bg-zinc-900/60 p-4 backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          {config.icon}
          {labelOverride ?? config.label}
        </div>
        <div className="mt-2 text-sm text-zinc-600">No data</div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border ${config.border} bg-linear-to-br ${config.gradient} bg-zinc-900/60 p-4 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
        {config.icon}
        {labelOverride ?? config.label}
      </div>
      <div className="mt-2 text-lg font-bold text-zinc-100">
        {config.format(first)}
      </div>
      <div className="mt-0.5 text-sm text-zinc-300">{first.gameName}</div>
      <div className="mt-0.5 text-xs text-zinc-500">
        {config.sublabelFn(first)}
      </div>

      {rest.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-[10px] font-medium text-zinc-600 transition-colors hover:text-zinc-400 cursor-pointer"
          >
            {expanded ? "Hide" : "2nd & 3rd"}
            <ChevronDown
              className={cn(
                "h-2.5 w-2.5 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
          {expanded && (
            <div className="mt-1.5 space-y-1 border-t border-zinc-800/50 pt-1.5">
              {rest.map((entry, i) => (
                <div
                  key={entry.gameName + i}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className={cn(
                      "w-4 text-center font-bold",
                      MEDAL_COLORS[i + 1] ?? "text-zinc-600",
                    )}
                  >
                    {i + 2}
                  </span>
                  <span className="text-zinc-400">{entry.gameName}</span>
                  <span className="ml-auto text-right">
                    <span className="font-medium text-zinc-300">
                      {config.format(entry)}
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-500">
                      {config.sublabelFn(entry)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const INITIAL_VISIBLE = 4;

function StatCardGrid({
  title,
  data,
  labelOverrides,
}: {
  title: string;
  data: Record<StatCategory, RankedEntry[]>;
  labelOverrides?: Partial<Record<StatCategory, string>>;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll
    ? CARD_CONFIGS
    : CARD_CONFIGS.slice(0, INITIAL_VISIBLE);
  const hasMore = CARD_CONFIGS.length > INITIAL_VISIBLE;

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-grid">
        {visible.map((config) => (
          <StatCard
            key={config.key}
            config={config}
            entries={data[config.key]}
            labelOverride={labelOverrides?.[config.key]}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800/40 hover:text-zinc-300 cursor-pointer"
        >
          {showAll
            ? "Show less"
            : `Show ${CARD_CONFIGS.length - INITIAL_VISIBLE} more`}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              showAll && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}

interface BestOfSectionProps {
  best: BestOfChallenge;
}

export default function BestOfSection({ best }: BestOfSectionProps) {
  return (
    <div className="space-y-6">
      <StatCardGrid title="Best of the Challenge" data={best.best} />
      <StatCardGrid
        title="Worst of the Challenge"
        data={best.worst}
        labelOverrides={WORST_LABEL_OVERRIDES}
      />
    </div>
  );
}
