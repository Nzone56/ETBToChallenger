import { PlayerRankedData } from "@/app/types/riot";
import RankBadge from "@/app/components/ui/RankBadge";
import WinrateBar from "@/app/components/ui/WinrateBar";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PlayerHeaderProps {
  player: PlayerRankedData;
  version: string;
}

export default function PlayerHeader({ player, version }: PlayerHeaderProps) {
  const wins = player.flexEntry?.wins ?? 0;
  const losses = player.flexEntry?.losses ?? 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ProfileIcon
            iconId={player.summoner?.profileIconId}
            version={version}
            size={72}
            className="ring-2 ring-zinc-700/50"
          />
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {player.gameName}
              <span className="ml-2 text-base font-normal text-zinc-500">
                #{player.tagLine}
              </span>
            </h1>
            <div className="mt-2">
              <RankBadge
                entry={player.flexEntry}
                size="lg"
                showLp
                showWinrate
              />
            </div>
          </div>
        </div>

        {player.flexEntry && (
          <div className="w-48">
            <WinrateBar wins={wins} losses={losses} />
          </div>
        )}
      </div>
    </div>
  );
}
