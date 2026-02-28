"use client";

import { useState } from "react";
import { MatchRecord } from "@/app/lib/db";
import ChampionIcon from "../ui/ChampionIcon";
import { cirLabel, PILLARS, POSITION_LABELS, RAW_STATS } from "./RecordData";
import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";

function CirLeaderboardCard({
  record,
  rank,
  version,
}: {
  record: MatchRecord;
  rank: number;
  version: string;
}) {
  const [open, setOpen] = useState(false);

  const { label, color } = cirLabel(record.value);
  const date = new Date(record.playedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const pos = record.teamPosition ?? "";
  const posLabel = POSITION_LABELS[pos] ?? pos;
  const bd = record.cirBreakdown;
  const st = record.cirStats;
  const kda = ((record.kills + record.assists) / (record.deaths || 1)).toFixed(
    1,
  );
  const rankStyle =
    rank === 1
      ? "border-yellow-500/40 bg-yellow-500/5"
      : rank === 2
        ? "border-zinc-500/40 bg-zinc-500/5"
        : rank === 3
          ? "border-amber-700/40 bg-amber-700/5"
          : "border-zinc-800/60 bg-zinc-900/30";

  const rankNumColor =
    rank === 1
      ? "text-yellow-400"
      : rank === 2
        ? "text-zinc-300"
        : rank === 3
          ? "text-amber-600"
          : "text-zinc-600";

  return (
    <div className={`rounded-xl border backdrop-blur-sm ${rankStyle}`}>
      {/* ── Header row (always visible, clickable) ── */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer"
        >
          {/* Rank */}
          <div className="w-6 shrink-0 text-center">
            <span className={`text-sm font-bold tabular-nums ${rankNumColor}`}>
              {rank}
            </span>
          </div>

          {/* Champion icon */}
          <ChampionIcon
            championName={record.championName}
            version={version}
            size={40}
            className="shrink-0 rounded-lg"
          />

          {/* Main info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-zinc-100 truncate">
                {record.gameName}
              </span>
              {posLabel && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  {posLabel}
                </span>
              )}
              <span
                className={`ml-auto text-[10px] font-semibold ${record.win ? "text-emerald-400" : "text-red-400"}`}
              >
                {record.win ? "WIN" : "LOSS"}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">
              {record.kills}/{record.deaths}/{record.assists} ·{" "}
              {Math.round(record.durationMin ?? 0)}min · {date}
            </div>

            {/* Pillar chips with values */}
            {bd && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PILLARS.map(({ key, label: pLabel, dotColor, textColor }) => (
                  <div
                    key={key}
                    className="flex items-center gap-1 rounded-md bg-zinc-800/60 px-1.5 py-0.5"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`}
                    />
                    <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide">
                      {pLabel}
                    </span>
                    <span
                      className={`text-[10px] font-bold tabular-nums ${textColor}`}
                    >
                      {bd[key].toFixed(1)}
                    </span>
                  </div>
                ))}
                <ChevronDown
                  className={`cursor-pointer mt-0.5 h-3.5 w-3.5 text-zinc-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </div>
            )}
          </div>

          {/* Score + chevron */}
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            <div className={`text-xl font-bold tabular-nums ${color}`}>
              {record.value.toFixed(1)}
            </div>
            <div className={`text-[10px] font-semibold ${color}`}>{label}</div>
          </div>
        </button>
      </div>

      {/* ── Accordion body ── */}
      {open && st && (
        <div className="border-t border-zinc-800/60 px-4 pb-4 pt-3">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Raw Stats — CIR Inputs
          </p>

          {/* Group stats by pillar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PILLARS.map(
              ({ key: pillarKey, label: pillarLabel, dotColor, textColor }) => {
                const rows = RAW_STATS.filter((s) => s.pillar === pillarKey);
                return (
                  <div
                    key={pillarKey}
                    className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3"
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}
                      >
                        {pillarLabel}
                      </span>
                      {bd && (
                        <span
                          className={`ml-auto text-xs font-bold tabular-nums ${textColor}`}
                        >
                          {bd[pillarKey].toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {/* KDA — only in combat panel, sourced from record */}
                      {pillarKey === "combat" && (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">KDA</span>
                            <span className="font-mono font-medium text-zinc-300 tabular-nums">
                              {kda}
                            </span>
                          </div>
                        </>
                      )}
                      {rows.map(({ key, label: statLabel, format }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-zinc-500">{statLabel}</span>
                          <span className="font-mono font-medium text-zinc-300 tabular-nums">
                            {format(st[key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* Go to Match Button */}
          <Link
            href={`/match/${record.matchId}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-500/20 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            Go to Match
          </Link>
        </div>
      )}
    </div>
  );
}

export default CirLeaderboardCard;
