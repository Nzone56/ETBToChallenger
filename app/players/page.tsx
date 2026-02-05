import MatchHistory from "../components/MatchHistory";
import { getAllUsersLastMatches } from "../lib/service";

export default async function PlayerPage() {
  const allUsersMatches = await getAllUsersLastMatches(440, 1, 0);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        Last Ranked Match for All Players
      </h1>
      <div className="space-y-8">
        {allUsersMatches.map(({ user, matches }) => (
          <div
            key={user.puuid}
            className="border border-gray-700 rounded-lg p-4"
          >
            <h2 className="text-lg font-semibold mb-3">
              {user.gameName}#{user.tagLine}
            </h2>
            {matches.length > 0 ? (
              <MatchHistory puuid={user.puuid} matches={matches} />
            ) : (
              <p className="text-gray-400">No matches found</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
