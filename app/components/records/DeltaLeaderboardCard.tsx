import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MatchRecord } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import RankNumber from "@/app/components/ui/RankNumber";
import ResultBadge from "@/app/components/ui/ResultBadge";
import { formatColombianDateShort } from "@/app/lib/dateUtils";
import { formatSigned } from "@/app/lib/format";
import { matchHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";
import type { DeltaLeaderboardConfig } from "./DeltaConfig";

interface DeltaLeaderboardCardProps {
  record: MatchRecord;
  rank: number;
  version: string;
  config: DeltaLeaderboardConfig;
}

/** One game's CIR against its team average or lane opponent. */
export function DeltaLeaderboardCard({ record, rank, version, config }: DeltaLeaderboardCardProps) {
  const lane = config.against === "lane";

  return (
    <Link
      href={matchHref(record.matchId)}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
    >
      <RankNumber position={rank} variant={config.tone} />
      <ChampionIcon championName={record.championName} version={version} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{record.gameName}</span>
          <span className="num text-xs text-faint">
            {record.kills}/{record.deaths}/{record.assists}
          </span>
        </div>
        {record.playerCIR !== undefined && record.contextValue !== undefined && (
          <p className="num mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {record.playerCIR.toFixed(1)}
            <ArrowRight className="size-3 text-faint" />
            {record.contextValue.toFixed(1)}
            <span className="text-faint">
              {lane && record.opponentChampionName ? `vs ${record.opponentChampionName}` : "team avg"}
            </span>
          </p>
        )}
        <div className="mt-1 flex items-center gap-2 text-[11px] text-faint">
          <ResultBadge result={record.win ? "win" : "loss"} />
          {formatColombianDateShort(record.playedAt)}
        </div>
      </div>
      <span
        className={cn(
          "num font-display text-xl font-semibold",
          config.tone === "best" ? "text-primary" : "text-loss",
        )}
      >
        {formatSigned(record.value, 1)}
      </span>
    </Link>
  );
}
