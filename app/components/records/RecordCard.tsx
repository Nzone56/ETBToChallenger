import Link from "next/link";
import {
  Anchor,
  Coins,
  Crown,
  Handshake,
  Skull,
  Swords,
  TrendingDown,
  TrendingUp,
  Wheat,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MatchRecord } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import ResultBadge from "@/app/components/ui/ResultBadge";
import { formatColombianDate } from "@/app/lib/dateUtils";
import { formatNumber, formatSigned } from "@/app/lib/format";
import { matchHref } from "@/app/lib/roster";
import { cn } from "@/app/lib/utils";

interface CategoryMeta {
  icon: LucideIcon;
  format: (v: number) => string;
  subtitle: (r: MatchRecord) => string;
}

const kda = (r: MatchRecord) => `${r.kills} / ${r.deaths} / ${r.assists}`;
const length = (r: MatchRecord) => `${Math.round(r.durationMin ?? 0)} min game`;
const lengthNoSupp = (r: MatchRecord) => `${length(r)} · excl. support`;
const whole = (v: number) => String(Math.round(v));
const signed = (v: number) => formatSigned(v);
const delta = (v: number) => formatSigned(v, 1);

const CATEGORY_META: Record<string, CategoryMeta> = {
  "Most Kills": { icon: Swords, format: whole, subtitle: kda },
  "Most Deaths": { icon: Skull, format: whole, subtitle: kda },
  "Most Assists": { icon: Handshake, format: whole, subtitle: kda },
  "Highest DMG/min": { icon: Zap, format: formatNumber, subtitle: length },
  "Highest Gold/min": { icon: Coins, format: formatNumber, subtitle: length },
  "Highest CS/min": { icon: Wheat, format: (v) => v.toFixed(2), subtitle: length },
  "Highest Gold Lead": { icon: TrendingUp, format: signed, subtitle: length },
  "Highest DMG Lead": { icon: TrendingUp, format: signed, subtitle: length },
  "Lowest DMG/min": { icon: Zap, format: formatNumber, subtitle: lengthNoSupp },
  "Lowest Gold/min": { icon: Coins, format: formatNumber, subtitle: lengthNoSupp },
  "Lowest CS/min": { icon: Wheat, format: (v) => v.toFixed(2), subtitle: lengthNoSupp },
  "Lowest Gold Lead": { icon: TrendingDown, format: signed, subtitle: lengthNoSupp },
  "Lowest DMG Lead": { icon: TrendingDown, format: signed, subtitle: lengthNoSupp },
  "1vs9 GOAT": { icon: Crown, format: delta, subtitle: () => "CIR Δ vs team average" },
  "Lane Dominator King": { icon: Zap, format: delta, subtitle: () => "CIR Δ vs lane opponent" },
  "Dead Weight Anchor": { icon: Anchor, format: delta, subtitle: () => "CIR Δ vs team average" },
  "Diffed Gap": { icon: TrendingDown, format: delta, subtitle: () => "CIR Δ vs lane opponent" },
};

interface RecordCardProps {
  record: MatchRecord;
  version: string;
  tone: "best" | "worst";
}

/** A single-game season record: the figure, who set it, on what. */
export default function RecordCard({ record, version, tone }: RecordCardProps) {
  const meta = CATEGORY_META[record.category];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <Link
      href={matchHref(record.matchId)}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong hover:bg-raised"
    >
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("size-3.5", tone === "best" ? "text-primary" : "text-loss")} />
        {record.category}
      </p>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="num font-display text-3xl font-semibold leading-none">{meta.format(record.value)}</p>
          <p className="mt-1.5 truncate text-xs text-faint">{meta.subtitle(record)}</p>
        </div>
        <ChampionIcon championName={record.championName} version={version} size={44} />
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3 text-xs">
        <span className="truncate font-semibold">{record.gameName}</span>
        <span className="truncate text-muted-foreground">{record.championName}</span>
        <ResultBadge result={record.win ? "win" : "loss"} className="ml-auto" />
        <span className="num shrink-0 text-faint">{formatColombianDate(record.playedAt)}</span>
      </div>
    </Link>
  );
}
