"use client";

import { useState } from "react";
import { RankedEntry } from "@/app/types/riot";
import { cn } from "@/app/lib/utils";
import { ChevronDown, TrendingUp } from "lucide-react";
import { CardConfig } from "./statCardConfigs";

const MEDAL_COLORS = ["text-yellow-400", "text-zinc-400", "text-amber-700"];

interface StatCardProps {
  config: CardConfig;
  entries: RankedEntry[];
  labelOverride?: string;
}

export default function StatCard({
  config,
  entries,
  labelOverride,
}: StatCardProps) {
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
      className={`group rounded-xl border ${config.border} bg-linear-to-br ${config.gradient} bg-zinc-900/60 p-4 backdrop-blur-sm transition-all hover:border-opacity-70 cursor-pointer`}
    >
      {/* Header with icon and trending indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
          {config.icon}
          <span className="truncate">{labelOverride ?? config.label}</span>
        </div>
        <TrendingUp className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Main value with gradient text effect */}
      <div className="mb-2">
        <div className="text-xl font-bold bg-linear-to-br from-zinc-50 to-zinc-300 bg-clip-text text-transparent">
          {config.format(first)}
        </div>
      </div>

      {/* Player info with better spacing */}
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-zinc-200 truncate">
          {first.gameName}
        </div>
        <div className="text-xs text-zinc-500">{config.sublabelFn(first)}</div>
      </div>

      {/* 2nd & 3rd place toggle */}
      {rest.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-[10px] font-medium text-zinc-600 transition-colors hover:text-zinc-400 cursor-pointer w-full"
          >
            {expanded ? "Hide" : "2nd & 3rd"}
            <ChevronDown
              className={cn(
                "h-2.5 w-2.5 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>

          {/* Enhanced 2nd & 3rd place cards */}
          {expanded && (
            <div className="mt-2 space-y-1.5 border-t border-zinc-800/50 pt-2">
              {rest.map((entry, i) => (
                <div
                  key={entry.gameName + i}
                  className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-zinc-800/50",
                      MEDAL_COLORS[i + 1] ?? "text-zinc-600",
                    )}
                  >
                    {i + 2}
                  </span>
                  <span className="text-xs text-zinc-300 truncate flex-1">
                    {entry.gameName}
                  </span>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-zinc-200">
                      {config.format(entry)}
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {config.sublabelFn(entry)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
