import { MatchRecord } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { formatColombianDate } from "@/app/lib/dateUtils";
import Link from "next/link";
import { Swords, Skull, Handshake, Zap, Coins, TrendingUp } from "lucide-react";

const CATEGORY_META: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    border: string;
    format: (v: number) => string;
    subtitle: (r: MatchRecord) => string;
  }
> = {
  "Most Kills": {
    icon: <Swords className="h-4 w-4 text-red-400" />,
    color: "text-red-300",
    border: "border-red-800/30",
    format: (v) => String(Math.round(v)),
    subtitle: (r) => `${r.kills} / ${r.deaths} / ${r.assists}`,
  },
  "Most Deaths": {
    icon: <Skull className="h-4 w-4 text-zinc-400" />,
    color: "text-zinc-300",
    border: "border-zinc-700/40",
    format: (v) => String(Math.round(v)),
    subtitle: (r) => `${r.kills} / ${r.deaths} / ${r.assists}`,
  },
  "Most Assists": {
    icon: <Handshake className="h-4 w-4 text-sky-400" />,
    color: "text-sky-300",
    border: "border-sky-800/30",
    format: (v) => String(Math.round(v)),
    subtitle: (r) => `${r.kills} / ${r.deaths} / ${r.assists}`,
  },
  "Highest DMG/min": {
    icon: <Zap className="h-4 w-4 text-orange-400" />,
    color: "text-orange-300",
    border: "border-orange-800/30",
    format: (v) => `${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game`,
  },
  "Highest Gold/min": {
    icon: <Coins className="h-4 w-4 text-yellow-400" />,
    color: "text-yellow-300",
    border: "border-yellow-800/30",
    format: (v) => `${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game`,
  },
  "Highest CS/min": {
    icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    color: "text-emerald-300",
    border: "border-emerald-800/30",
    format: (v) => v.toFixed(2),
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game`,
  },
  "Highest Gold Lead": {
    icon: <Coins className="h-4 w-4 text-amber-400" />,
    color: "text-amber-300",
    border: "border-amber-800/30",
    format: (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game`,
  },
  "Highest DMG Lead": {
    icon: <Zap className="h-4 w-4 text-fuchsia-400" />,
    color: "text-fuchsia-300",
    border: "border-fuchsia-800/30",
    format: (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game`,
  },
  "Lowest DMG/min": {
    icon: <Zap className="h-4 w-4 text-red-600" />,
    color: "text-red-400",
    border: "border-red-900/30",
    format: (v) => `${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game · excl. supp`,
  },
  "Lowest Gold/min": {
    icon: <Coins className="h-4 w-4 text-zinc-500" />,
    color: "text-zinc-400",
    border: "border-zinc-700/30",
    format: (v) => `${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game · excl. supp`,
  },
  "Lowest CS/min": {
    icon: <TrendingUp className="h-4 w-4 text-zinc-500" />,
    color: "text-zinc-400",
    border: "border-zinc-700/30",
    format: (v) => v.toFixed(2),
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game · excl. supp`,
  },
  "Lowest Gold Lead": {
    icon: <Coins className="h-4 w-4 text-red-600" />,
    color: "text-red-400",
    border: "border-red-900/30",
    format: (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game · excl. supp`,
  },
  "Lowest DMG Lead": {
    icon: <Zap className="h-4 w-4 text-red-600" />,
    color: "text-red-400",
    border: "border-red-900/30",
    format: (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString()}`,
    subtitle: (r) => `${Math.round(r.durationMin ?? 0)}min game · excl. supp`,
  },
};

function RecordCard({
  record,
  version,
}: {
  record: MatchRecord;
  version: string;
}) {
  const meta = CATEGORY_META[record.category];
  const date = formatColombianDate(record.playedAt);

  return (
    <Link
      href={`/match/${record.matchId}`}
      className={`flex items-center gap-3 rounded-xl border ${meta.border} bg-zinc-900/50 px-4 py-3 backdrop-blur-sm transition-all hover:bg-zinc-900/70 hover:border-opacity-60 cursor-pointer`}
    >
      <ChampionIcon
        championName={record.championName}
        version={version}
        size={44}
        className="shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {meta.icon}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {record.category}
          </span>
        </div>
        <div className={`text-xl font-bold tabular-nums ${meta.color}`}>
          {meta.format(record.value)}
        </div>
        <div className="text-xs text-zinc-400 truncate">
          {meta.subtitle(record)}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-zinc-200 truncate max-w-20">
          {record.gameName}
        </div>
        <div className="text-xs text-zinc-500 truncate max-w-20">
          {record.championName}
        </div>
        <div className="text-[10px] text-zinc-600">{date}</div>
        <div
          className={`mt-0.5 text-[10px] font-semibold ${record.win ? "text-emerald-400" : "text-red-400"}`}
        >
          {record.win ? "WIN" : "LOSS"}
        </div>
      </div>
    </Link>
  );
}
export default RecordCard;
