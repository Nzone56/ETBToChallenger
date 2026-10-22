"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { MatchRecord } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import CirBadge from "@/app/components/ui/CirBadge";
import RankNumber from "@/app/components/ui/RankNumber";
import ResultBadge from "@/app/components/ui/ResultBadge";
import { roleLabel } from "@/app/components/ui/RoleIcon";
import { formatColombianDateShort } from "@/app/lib/dateUtils";
import { calcKda, formatKda } from "@/app/lib/format";
import { matchHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";
import { PILLARS, RAW_STATS } from "./RecordData";

interface CirLeaderboardCardProps {
  record: MatchRecord;
  rank: number;
  version: string;
  variant: "best" | "worst";
}

/** A top/worst CIR game. Opens to show the pillar breakdown and raw inputs. */
export default function CirLeaderboardCard({ record, rank, version, variant }: CirLeaderboardCardProps) {
  const [open, setOpen] = useState(false);
  const bd = record.cirBreakdown;
  const st = record.cirStats;

  return (
    <div className={cn("transition-colors", open && "bg-raised/40")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <RankNumber position={rank} variant={variant} />
        <ChampionIcon championName={record.championName} version={version} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{record.gameName}</span>
            <span className="text-xs text-faint">{roleLabel(record.teamPosition ?? "")}</span>
            <ResultBadge result={record.win ? "win" : "loss"} />
          </div>
          <p className="num mt-0.5 text-xs text-muted-foreground">
            {record.kills}/{record.deaths}/{record.assists} · {Math.round(record.durationMin ?? 0)} min ·{" "}
            {formatColombianDateShort(record.playedAt)}
          </p>
          {bd && (
            <div className="mt-1.5 flex flex-wrap gap-2.5">
              {PILLARS.map((p) => (
                <span key={p.key} className="num flex items-center gap-1 text-[11px]" title={p.label}>
                  <span className={cn("size-1.5 rounded-full", p.dot)} />
                  <span className="text-faint">{p.short}</span>
                  <span className={cn("font-semibold", p.text)}>{bd[p.key].toFixed(1)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <CirBadge score={record.value} detail="label" />
        <ChevronDown className={cn("size-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && st && (
        <div className="appear border-t border-border px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.key} className="rounded-lg border border-border bg-card p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                  <span className={cn("size-2 rounded-full", p.dot)} />
                  <span className={p.text}>{p.label}</span>
                  {bd && <span className={cn("num ml-auto", p.text)}>{bd[p.key].toFixed(2)}</span>}
                </p>
                <dl className="space-y-1 text-xs">
                  {p.key === "combat" && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">KDA</dt>
                      <dd className="num">{formatKda(calcKda(record.kills, record.deaths, record.assists))}</dd>
                    </div>
                  )}
                  {RAW_STATS.filter((s) => s.pillar === p.key).map((s) => (
                    <div key={s.key + s.pillar} className="flex justify-between">
                      <dt className="text-muted-foreground">{s.label}</dt>
                      <dd className="num">{s.format(st[s.key])}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <Link
            href={matchHref(record.matchId)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <ExternalLink className="size-3.5" />
            Open match
          </Link>
        </div>
      )}
    </div>
  );
}
