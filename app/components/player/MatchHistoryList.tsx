"use client";

import { History, Loader2 } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import EmptyState from "@/app/components/ui/EmptyState";
import MoreButton from "@/app/components/ui/MoreButton";
import type { Match } from "@/app/types/riot";
import MatchFiltersBar, { type MatchCompanion } from "./matchHistory/MatchFiltersBar";
import MatchRow from "./matchHistory/MatchRow";
import { activeFilterCount, useMatchHistory } from "./matchHistory/useMatchHistory";

interface MatchHistoryListProps {
  puuid: string;
  initialMatches: Match[];
  version: string;
  pageSize?: number;
  totalGames: number;
  /** Champions played this season, most played first */
  champions: string[];
  companions?: MatchCompanion[];
}

export default function MatchHistoryList({
  puuid,
  initialMatches,
  version,
  pageSize = 10,
  totalGames,
  champions,
  companions = [],
}: MatchHistoryListProps) {
  const { matches, filters, setFilters, total, loading, hasMore, loadMore } =
    useMatchHistory(puuid, initialMatches, totalGames, pageSize);
  const filtered = activeFilterCount(filters) > 0;

  return (
    <Panel>
      <PanelHeader
        icon={History}
        title="Match history"
        description={
          filtered ? `${total} games match the filters` : `${totalGames} Flex games this season`
        }
        actions={loading && <Loader2 className="size-4 animate-spin text-primary" />}
      />
      <MatchFiltersBar
        filters={filters}
        onChange={setFilters}
        champions={champions}
        companions={companions}
        version={version}
      />

      {matches.length === 0 && !loading ? (
        <EmptyState
          title="No games found"
          description={filtered ? "Nothing matches these filters." : undefined}
        />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <div className="divide-y divide-border">
            {matches.map((match) => (
              <MatchRow key={match.metadata.matchId} match={match} puuid={puuid} version={version} />
            ))}
          </div>
        </div>
      )}

      {hasMore ? (
        <MoreButton onClick={loadMore} loading={loading}>
          Load {Math.min(pageSize, total - matches.length)} more · {total - matches.length} left
        </MoreButton>
      ) : (
        matches.length > 0 && (
          <p className="border-t border-border py-2.5 text-center text-xs text-faint">
            That&apos;s every game{filtered ? " for these filters" : " this season"}
          </p>
        )
      )}
    </Panel>
  );
}
