import { riotEndpoints } from "./endpoints";
import { riotFetch } from "./client";
import { users } from "../data/users";

export async function getRankedMatches(
  puuid: string,
  queue = 440,
  count: number,
  start: number,
) {
  const matchIds = await riotFetch<string[]>(
    riotEndpoints.matchIdsByPuuid(puuid, queue, count, start),
  );

  return Promise.all(
    matchIds.map((id) => riotFetch(riotEndpoints.matchById(id))),
  );
}

export async function getAllUsersLastMatches(
  queue = 440,
  count = 1,
  start = 0,
) {
  return Promise.all(
    users.map(async (user) => {
      try {
        const matches = await getRankedMatches(user.puuid, queue, count, start);
        return {
          user,
          matches,
        };
      } catch (error) {
        console.error(`Error fetching matches for ${user.gameName}:`, error);
        return {
          user,
          matches: [],
        };
      }
    }),
  );
}
