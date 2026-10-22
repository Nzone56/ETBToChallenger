"use client";

import { X } from "lucide-react";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { cn } from "@/app/lib/utils";
import {
  activeFilterCount,
  NO_FILTERS,
  type MatchFilters,
  type ResultFilter,
} from "./useMatchHistory";

export interface MatchCompanion {
  puuid: string;
  gameName: string;
}

const RESULT_OPTIONS: { value: ResultFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "win", label: "Wins" },
  { value: "loss", label: "Losses" },
  { value: "remake", label: "Remakes" },
];

interface MatchFiltersBarProps {
  filters: MatchFilters;
  onChange: (filters: MatchFilters) => void;
  champions: string[];
  companions: MatchCompanion[];
  version: string;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Result, champion and "played with" filters for the match history. */
export default function MatchFiltersBar({
  filters,
  onChange,
  champions,
  companions,
  version,
}: MatchFiltersBarProps) {
  const count = activeFilterCount(filters);

  return (
    <div className="space-y-3 border-b border-border px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          options={RESULT_OPTIONS}
          value={filters.result}
          onChange={(result) => onChange({ ...filters, result })}
          ariaLabel="Filter by result"
        />
        {companions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-faint">Played with</span>
            {companions.map((c) => {
              const on = filters.companions.includes(c.puuid);
              return (
                <Chip
                  key={c.puuid}
                  active={on}
                  onClick={() =>
                    onChange({
                      ...filters,
                      companions: on
                        ? filters.companions.filter((x) => x !== c.puuid)
                        : [...filters.companions, c.puuid],
                    })
                  }
                >
                  {c.gameName}
                </Chip>
              );
            })}
          </div>
        )}
        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear {count}
          </button>
        )}
      </div>

      {champions.length > 0 && (
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1">
          {champions.map((champ) => (
            <Chip
              key={champ}
              active={filters.champion === champ}
              onClick={() =>
                onChange({ ...filters, champion: filters.champion === champ ? "" : champ })
              }
            >
              <ChampionIcon championName={champ} version={version} size={18} className="rounded-sm" />
              {champ}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
