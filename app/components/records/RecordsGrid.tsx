import type { MatchRecord } from "@/app/lib/db";
import type { PentakillEvent } from "@/app/lib/db";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import {
  Swords,
  Skull,
  Handshake,
  Zap,
  Coins,
  TrendingUp,
  Star,
  Trophy,
} from "lucide-react";

interface RecordsGridProps {
  records: MatchRecord[];
  pentakills: PentakillEvent[];
  version: string;
}

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

const BEST_ORDER = [
  "Most Kills",
  "Most Assists",
  "Highest DMG/min",
  "Highest Gold/min",
  "Highest CS/min",
  "Highest Gold Lead",
  "Highest DMG Lead",
];

const WORST_ORDER = [
  "Most Deaths",
  "Lowest DMG/min",
  "Lowest Gold/min",
  "Lowest CS/min",
  "Lowest Gold Lead",
  "Lowest DMG Lead",
];

function RecordCard({
  record,
  version,
}: {
  record: MatchRecord;
  version: string;
}) {
  const meta = CATEGORY_META[record.category];
  const date = new Date(record.playedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border ${meta.border} bg-zinc-900/50 px-4 py-3 backdrop-blur-sm`}
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
    </div>
  );
}

function PentakillCard({
  event,
  version,
}: {
  event: PentakillEvent;
  version: string;
}) {
  const date = new Date(event.playedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-800/30 bg-indigo-950/20 px-4 py-3 backdrop-blur-sm">
      <ChampionIcon
        championName={event.championName}
        version={version}
        size={44}
        className="shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Star className="h-4 w-4 text-indigo-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Pentakill
          </span>
          {event.pentaKills > 1 && (
            <span className="rounded bg-indigo-500/20 px-1 py-0.5 text-[10px] font-bold text-indigo-300">
              ×{event.pentaKills}
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-indigo-300">PENTA</div>
        <div className="text-xs text-zinc-400 truncate">
          {event.championName}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-zinc-200 truncate max-w-20">
          {event.gameName}
        </div>
        <div className="text-[10px] text-zinc-600">{date}</div>
      </div>
    </div>
  );
}

export default function RecordsGrid({
  records,
  pentakills,
  version,
}: RecordsGridProps) {
  const recordMap = new Map(records.map((r) => [r.category, r]));

  return (
    <div className="space-y-10">
      {/* Best Records */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Best Individual Performances
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BEST_ORDER.map((cat) => {
            const record = recordMap.get(cat);
            if (!record) return null;
            return <RecordCard key={cat} record={record} version={version} />;
          })}
        </div>
      </section>

      {/* Worst Records */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Skull className="h-4 w-4 text-red-500" />
          Worst Individual Performances
          <span className="text-xs font-normal text-zinc-600">
            (excl. support for farm/gold/dmg)
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {WORST_ORDER.map((cat) => {
            const record = recordMap.get(cat);
            if (!record) return null;
            return <RecordCard key={cat} record={record} version={version} />;
          })}
        </div>
      </section>

      {/* Pentakill Counter */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          <Star className="h-4 w-4 text-indigo-400" />
          Pentakill Counter
          <span className="text-xs font-normal text-zinc-600">
            ({pentakills.reduce((s, e) => s + e.pentaKills, 0)} total)
          </span>
        </h2>
        {pentakills.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
            No pentakills yet — go get one!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pentakills.map((e) => (
              <PentakillCard
                key={e.matchId + e.puuid}
                event={e}
                version={version}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
