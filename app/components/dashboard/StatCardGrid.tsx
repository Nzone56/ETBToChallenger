"use client";

import { useState } from "react";
import { RankedEntry, StatCategory } from "@/app/types/riot";
import { cn } from "@/app/lib/utils";
import { ChevronDown } from "lucide-react";
import { CARD_CONFIGS, CardConfig } from "./statCardConfigs";
import StatCard from "./StatCard";

const INITIAL_VISIBLE = 4;

interface StatCardGridProps {
  title: string;
  data: Record<StatCategory, RankedEntry[]>;
  labelOverrides?: Partial<Record<StatCategory, string>>;
}

export default function StatCardGrid({
  title,
  data,
  labelOverrides,
}: StatCardGridProps) {
  const [showAll, setShowAll] = useState(false);
  const visible: CardConfig[] = showAll
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
