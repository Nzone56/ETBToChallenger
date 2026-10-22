"use client";

import { useEffect, useRef, useState } from "react";
import type { Match } from "@/app/types/riot";

export type ResultFilter = "all" | "win" | "loss" | "remake";

export interface MatchFilters {
  result: ResultFilter;
  champion: string;
  companions: string[];
}

export const NO_FILTERS: MatchFilters = { result: "all", champion: "", companions: [] };

export function activeFilterCount(f: MatchFilters): number {
  return (f.result !== "all" ? 1 : 0) + (f.champion ? 1 : 0) + f.companions.length;
}

function query(puuid: string, f: MatchFilters, start: number, count: number): string {
  const params = new URLSearchParams({ puuid, start: String(start), count: String(count) });
  if (f.result !== "all") params.set("result", f.result);
  if (f.champion) params.set("champion", f.champion);
  if (f.companions.length > 0) params.set("companions", f.companions.join(","));
  return `/api/matches?${params}`;
}

/**
 * Match history paging and filtering against /api/matches. The first page
 * arrives from the server render; the hook only fetches when filters change
 * or the user asks for more.
 */
export function useMatchHistory(
  puuid: string,
  initialMatches: Match[],
  totalGames: number,
  pageSize: number,
) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [filters, setFilters] = useState<MatchFilters>(NO_FILTERS);
  const [total, setTotal] = useState(totalGames);
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // The server already rendered the unfiltered first page.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(query(puuid, filters, 0, pageSize))
      .then((r) => r.json())
      .then((data: { matches?: Match[]; totalFiltered?: number }) => {
        if (cancelled || !data.matches) return;
        setMatches(data.matches);
        setTotal(data.totalFiltered ?? data.matches.length);
      })
      .catch((err) => console.error("Failed to fetch filtered matches:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [puuid, filters, pageSize]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(query(puuid, filters, matches.length, pageSize));
      const data: { matches?: Match[]; totalFiltered?: number } = await res.json();
      if (data.matches) {
        setMatches((prev) => [...prev, ...data.matches!]);
        if (data.totalFiltered !== undefined) setTotal(data.totalFiltered);
      }
    } catch (err) {
      console.error("Failed to load more matches:", err);
    } finally {
      setLoading(false);
    }
  }

  return {
    matches,
    filters,
    setFilters,
    total,
    loading,
    hasMore: matches.length < total,
    loadMore,
  };
}
