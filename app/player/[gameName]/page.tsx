import MatchHistory from "../../components/MatchHistory";
import { getRankedMatches } from "../../lib/service";
import { getUserByRiotId } from "../../data/users";
import { notFound } from "next/navigation";

interface PlayerPageProps {
  params: Promise<{
    gameName: string;
    tagLine: string;
  }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  // Await the params Promise
  const { gameName } = await params;

  // Decode URL parameters
  const decodedGameName = decodeURIComponent(gameName);

  // Find user by gameName and tagLine
  const user = getUserByRiotId(decodedGameName, "ETB");

  if (!user) {
    notFound();
  }

  const matches = await getRankedMatches(user.puuid, 440, 10, 0);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        Ranked Match History - {decodedGameName}#ETB
      </h1>
      <MatchHistory puuid={user.puuid} matches={matches} />
    </main>
  );
}
