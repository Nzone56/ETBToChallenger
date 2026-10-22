import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { getMatchById } from "@/app/lib/db";
import { getDdragonVersion } from "@/app/lib/service";
import { buildMatchView } from "@/app/lib/matchView";
import { Match } from "@/app/types/riot";
import { users } from "@/app/data/users";
import MatchHeader from "@/app/components/match/MatchHeader";
import MatchTeamTable from "@/app/components/match/MatchTeamTable";
import MatchStats from "@/app/components/match/MatchStats";
import MatchMVP from "@/app/components/match/MatchMVP";
import EmptyState from "@/app/components/ui/EmptyState";
import { GoBackButton } from "@/app/components/buttons/GoBackButton";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

export const metadata: Metadata = { title: "Match" };

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const [matchData, version] = await Promise.all([getMatchById(matchId), getDdragonVersion()]);

  if (!matchData) {
    return (
      <EmptyState
        size="full"
        icon={SearchX}
        title="Match not found"
        description={`No match with id ${matchId} is stored. It may be from before the season or from another queue.`}
        action={<GoBackButton />}
      />
    );
  }

  const match = matchData as Match;
  const view = buildMatchView(match, new Set(users.map((u) => u.puuid)));
  const minutes = match.info.gameDuration / 60;

  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="appear-children space-y-6">
        <MatchHeader match={match} view={view} />
        {view.mvp && <MatchMVP mvp={view.mvp} version={version} />}
        {view.teams.map((team) => (
          <MatchTeamTable key={team.teamId} team={team} remake={view.remake} minutes={minutes} version={version} />
        ))}
        {!view.remake && <MatchStats view={view} />}
      </div>
    </div>
  );
}
