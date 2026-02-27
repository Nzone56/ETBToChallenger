"use client";

import { useState } from "react";
import { RankedEntry } from "@/app/types/riot";
import { cn } from "@/app/lib/utils";
import { ChevronDown } from "lucide-react";
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
