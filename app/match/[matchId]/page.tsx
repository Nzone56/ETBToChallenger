import { getMatchById } from "@/app/lib/db";
import { getDdragonVersion } from "@/app/lib/service";
import { Match } from "@/app/types/riot";
import { users } from "@/app/data/users";
import { isRemake } from "@/app/lib/format";
import MatchHeader from "@/app/components/match/MatchHeader";
import MatchTeamTable from "@/app/components/match/MatchTeamTable";
import MatchStats from "@/app/components/match/MatchStats";
import MatchMVP from "@/app/components/match/MatchMVP";
import { GoBackButton } from "@/app/components/buttons/GoBackButton";

interface MatchPageProps {
  params: { matchId: string };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;

  // Fetch match from database
  const matchData = await getMatchById(matchId);
  if (!matchData) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="rounded-xl border border-red-800/40 bg-red-950/20 px-8 py-12 max-w-md">
            <h1 className="text-3xl font-bold text-red-400 mb-3">
              Match Not Found
            </h1>
            <p className="text-zinc-400 mb-6">
              The match you&apos;re looking for couldn&apos;t be found in our
              database.
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              Match ID:{" "}
              <span className="font-mono text-zinc-400">{matchId}</span>
            </p>
            <GoBackButton />
          </div>
        </div>
      </main>
    );
  }
  const match = matchData as Match;
  const version = await getDdragonVersion();
  const remake = isRemake(match.info.gameDuration);

  // Identify challenge players in this match
  const challengePuuids = new Set(users.map((u) => u.puuid));
  const challengeParticipants = match.info.participants.filter((p) =>
    challengePuuids.has(p.puuid),
  );

  // Split participants into teams
  const team100 = match.info.participants.filter((p) => p.teamId === 100);
  const team200 = match.info.participants.filter((p) => p.teamId === 200);

  // Get team results
  const team100Win =
    match.info.teams.find((t) => t.teamId === 100)?.win ?? false;
  const team200Win =
    match.info.teams.find((t) => t.teamId === 200)?.win ?? false;

  return (
    <main className="mx-auto max-w-6xl px-4 py-4 ">
      <div className="animate-fade-in">
        <GoBackButton />
      </div>

      <div className="mt-4 space-y-6 stagger-children">
        {/* Match Header */}
        <MatchHeader
          match={match}
          challengeParticipants={challengeParticipants}
        />

        {/* MVP Section — hidden for remakes */}
        {!remake && (
          <MatchMVP
            match={match}
            allParticipants={match.info.participants}
            version={version}
          />
        )}

        {/* Team Tables */}
        <div className="space-y-4">
          <MatchTeamTable
            participants={team100}
            teamId={100}
            win={team100Win}
            version={version}
            match={match}
            challengePuuids={challengePuuids}
          />
          <MatchTeamTable
            participants={team200}
            teamId={200}
            win={team200Win}
            version={version}
            match={match}
            challengePuuids={challengePuuids}
          />
        </div>

        {/* Team Comparison — hidden for remakes */}
        {!remake && (
          <MatchStats
            match={match}
            challengeParticipants={challengeParticipants}
          />
        )}
      </div>
    </main>
  );
}
