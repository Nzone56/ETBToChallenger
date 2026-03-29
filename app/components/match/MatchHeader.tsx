import { Match, MatchParticipant } from "@/app/types/riot";
import { Trophy, Clock, Calendar, Users, RefreshCw } from "lucide-react";
import { formatColombianDate, formatColombianTime } from "@/app/lib/dateUtils";
import { isRemake } from "@/app/lib/format";

interface MatchHeaderProps {
  match: Match;
  challengeParticipants: MatchParticipant[];
}

export default function MatchHeader({
  match,
  challengeParticipants,
}: MatchHeaderProps) {
  const duration = Math.floor(match.info.gameDuration / 60);
  const durationSec = match.info.gameDuration % 60;
  const date = formatColombianDate(match.info.gameStartTimestamp);
  const time = formatColombianTime(match.info.gameStartTimestamp);

  const team100 = match.info.teams.find((t) => t.teamId === 100);
  const team200 = match.info.teams.find((t) => t.teamId === 200);
  const remake = isRemake(match.info.gameDuration);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Match Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-2">Match Details</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
              <span className="text-zinc-600">·</span>
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                {duration}:{String(durationSec).padStart(2, "0")}
              </span>
            </div>
            {challengeParticipants.length > 0 && (
              <>
                <span className="text-zinc-600">·</span>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-teal-400" />
                  <span className="text-teal-400 font-medium">
                    {challengeParticipants.length} Challenge Player
                    {challengeParticipants.length > 1 ? "s" : ""}
                  </span>
                </div>
              </>
            )}
          </div>
          {challengeParticipants.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {challengeParticipants.map((p) => (
                <span
                  key={p.puuid}
                  className="rounded-md bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 text-xs font-medium text-teal-400"
                >
                  {p.riotIdGameName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Team Results */}
        {remake ? (
          <div className="rounded-lg border border-zinc-700/40 bg-zinc-800/40 px-6 py-3 text-center">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-bold text-zinc-400">REMAKE</span>
            </div>
            <p className="mt-1 text-xs text-zinc-600">Game ended early</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <div
              className={`rounded-lg border px-4 py-3 text-center ${
                team100?.win
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-red-500/40 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className={`h-4 w-4 ${team100?.win ? "text-emerald-400" : "text-red-400"}`}
                />
                <span
                  className={`text-sm font-bold ${team100?.win ? "text-emerald-400" : "text-red-400"}`}
                >
                  {team100?.win ? "VICTORY" : "DEFEAT"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Blue Team</p>
            </div>

            <div
              className={`rounded-lg border px-4 py-3 text-center ${
                team200?.win
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-red-500/40 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className={`h-4 w-4 ${team200?.win ? "text-emerald-400" : "text-red-400"}`}
                />
                <span
                  className={`text-sm font-bold ${team200?.win ? "text-emerald-400" : "text-red-400"}`}
                >
                  {team200?.win ? "VICTORY" : "DEFEAT"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Red Team</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
