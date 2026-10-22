import { loadRoster, byLadder, playerHref } from "@/app/lib/roster";
import { getDdragonVersion } from "@/app/lib/service";
import RosterNavList from "./RosterNavList";
import Skeleton from "@/app/components/ui/Skeleton";

/** The tracked players, by ladder position, as quick links. Streams in. */
export default async function RosterNav() {
  const [roster, version] = await Promise.all([loadRoster(), getDdragonVersion()]);

  const players = byLadder(roster).map((p) => ({
    puuid: p.puuid,
    gameName: p.gameName,
    href: playerHref(p.gameName),
    profileIconId: p.profileIconId,
    tier: p.flexEntry?.tier ?? null,
    division: p.flexEntry?.rank ?? null,
    lp: p.flexEntry?.leaguePoints ?? null,
    hotStreak: p.flexEntry?.hotStreak ?? false,
  }));

  return <RosterNavList players={players} version={version} />;
}

export function RosterNavSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-1">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
          <Skeleton className="size-6 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
