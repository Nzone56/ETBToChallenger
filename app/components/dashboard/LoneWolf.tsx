import { LoneWolfEntry } from "@/app/lib/db";
import { ShieldAlert } from "lucide-react";
import ProfileIcon from "@/app/components/ui/ProfileIcon";

interface LoneWolfProps {
  entries: LoneWolfEntry[];
  version: string;
}

export default function LoneWolf({ entries, version }: LoneWolfProps) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  if (sorted.every((e) => e.score === 0)) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <ShieldAlert className="h-4 w-4 text-violet-400" />

        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          🫧💄💋🎀💖 Divas 🫧💄💋🎀💖
        </h2>
      </div>

      {/* Table */}
      <div className="divide-y divide-zinc-800/50">
        {sorted.map((entry, i) => {
          if (
            entry.score === 0 &&
            entry.soloGames === 0 &&
            entry.duoGames === 0
          )
            return null;
          const isTop = i === 0 && entry.score > 0;
          return (
            <div
              key={entry.puuid}
              className={`flex items-center gap-3 px-4 py-2.5 ${isTop ? "bg-violet-500/5" : ""}`}
            >
              {/* Rank */}
              <span
                className={`w-5 shrink-0 text-center text-xs font-bold tabular-nums ${
                  i === 0
                    ? "text-violet-400"
                    : i === 1
                      ? "text-zinc-300"
                      : i === 2
                        ? "text-amber-600"
                        : "text-zinc-600"
                }`}
              >
                {i + 1}
              </span>

              {/* Avatar + Name */}
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <ProfileIcon
                  iconId={entry.profileIconId}
                  version={version}
                  size={24}
                  className="ring-1 ring-zinc-700/60 shrink-0"
                />
                <span className="truncate text-sm font-medium text-zinc-200">
                  {entry.gameName}
                </span>
              </div>

              {/* Breakdown */}
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span
                  className="rounded bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-violet-400 font-medium"
                  title="Solo games (5 pts each)"
                >
                  {entry.soloGames} solo
                </span>
                <span
                  className="rounded bg-zinc-700/40 border border-zinc-700/60 px-1.5 py-0.5 text-zinc-400 font-medium"
                  title="Duo games (1 pt each)"
                >
                  {entry.duoGames} duo
                </span>
              </div>

              {/* Score */}
              <span
                className={`w-12 shrink-0 text-right text-sm font-bold tabular-nums ${
                  isTop ? "text-violet-400" : "text-zinc-300"
                }`}
              >
                {entry.score}
                <span className="ml-0.5 text-[9px] font-normal text-zinc-600">
                  pts
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
