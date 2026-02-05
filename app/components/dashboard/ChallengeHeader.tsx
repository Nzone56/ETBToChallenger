"use client";

import { useState } from "react";
import ProgressBarSegmented from "@/app/components/ui/ProgressBarSegmented";
import RankEmblem from "@/app/components/ui/RankEmblem";
import { ChevronDown, Target } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { RankTier } from "@/app/types/riot";
import { CHALLENGER_LP, AVG_LP_PER_WIN } from "@/app/data/constants";

interface PlayerLpData {
  gameName: string;
  totalLp: number;
  tierLabel: string;
  tier: RankTier;
}

interface ChallengeHeaderProps {
  avgLp: number;
  avgTierLabel: string;
  avgTier: RankTier;
  playerCount: number;
  players: PlayerLpData[];
}

export default function ChallengeHeader({
  avgLp,
  avgTierLabel,
  avgTier,
  playerCount,
  players,
}: ChallengeHeaderProps) {
  const [expanded, setExpanded] = useState(false);

  const sortedPlayers = [...players].sort((a, b) => b.totalLp - a.totalLp);

  const lpRemaining = Math.max(CHALLENGER_LP - avgLp, 0);
  const estimatedWins = Math.ceil(lpRemaining / AVG_LP_PER_WIN);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            ETB to Challenger
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            {playerCount} players · Average Elo:{" "}
            <RankEmblem tier={avgTier} size={18} />
            <span className="font-semibold text-zinc-200">{avgTierLabel}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{avgLp}</div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">
            Average LP
          </div>
        </div>
      </div>

      {/* LP to Challenger */}
      {lpRemaining > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-800/40 px-4 py-2.5">
          <Target className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs text-zinc-400">
            <span className="font-semibold text-zinc-200">
              {lpRemaining} LP
            </span>{" "}
            to Challenger
            {" · "}~
            <span className="font-semibold text-zinc-200">
              {estimatedWins} wins
            </span>{" "}
            needed
            <span className="text-zinc-600">
              {" "}
              (avg {AVG_LP_PER_WIN} LP/win)
            </span>
          </p>
        </div>
      )}
      <div className="mt-5">
        <ProgressBarSegmented currentLp={avgLp} label="Team Average" />
      </div>

      {/* Expandable per-player bars */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300 cursor-pointer"
      >
        {expanded ? "Hide" : "Show"} individual players
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {sortedPlayers.map((player) => (
            <div key={player.gameName} className="flex items-center gap-2">
              <RankEmblem tier={player.tier} size={20} />
              <div className="flex-1">
                <ProgressBarSegmented
                  currentLp={player.totalLp}
                  label={player.gameName}
                  sublabel={`${player.tierLabel} · ${player.totalLp} LP`}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
