import { riotFetch, riotFetchMatch, riotFetchRanked } from "./client";
import { users } from "../data/users";
import {
  LeagueEntry,
  Match,
  Summoner,
  PlayerRankedData,
  PlayerDashboardData,
} from "../types/riot";
import { QUEUE_FLEX, SEASON_START_EPOCH } from "../data/constants";
import { riotEndpoints } from "./endpoints";

// ─── DDragon Version ───
let cachedVersion: string | null = null;

export async function getDdragonVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  const res = await fetch(riotEndpoints.ddragonVersions(), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`DDragon versions fetch failed: ${res.status}`);
  const versions: string[] = await res.json();
  cachedVersion = versions[0];
  return cachedVersion;
}

// ─── Summoner (for profile icon) ───
export async function getSummoner(puuid: string): Promise<Summoner> {
  return riotFetch<Summoner>(riotEndpoints.summonerByPuuid(puuid), 3600);
}

// ─── Ranked Entries (by puuid — no summoner ID needed) ───
export async function getRankedEntries(puuid: string): Promise<LeagueEntry[]> {
  return riotFetchRanked<LeagueEntry[]>(riotEndpoints.rankedByPuuid(puuid));
}

export function getFlexEntry(entries: LeagueEntry[]): LeagueEntry | null {
  return entries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;
}

// ─── Season start as epoch seconds (Riot API uses seconds) ───
const SEASON_START_SECONDS = Math.floor(SEASON_START_EPOCH / 1000);

// ─── Match IDs (supports pagination + season filter) ───
export async function getMatchIds(
  puuid: string,
  queue = QUEUE_FLEX,
  count = 10,
  start = 0,
  startTime?: number,
): Promise<string[]> {
  return riotFetch<string[]>(
    riotEndpoints.matchIdsByPuuid(puuid, queue, count, start, startTime),
  );
}

// ─── Fetch ALL match IDs for the current season (paginated) ───
export async function getAllSeasonMatchIds(
  puuid: string,
  queue = QUEUE_FLEX,
): Promise<string[]> {
  const PAGE_SIZE = 100; // Riot max per request
  const allIds: string[] = [];
  let start = 0;

  while (true) {
    const ids = await getMatchIds(
      puuid,
      queue,
      PAGE_SIZE,
      start,
      SEASON_START_SECONDS,
    );
    allIds.push(...ids);
    if (ids.length < PAGE_SIZE) break; // no more pages
    start += PAGE_SIZE;
  }

  return allIds;
}

// ─── Single Match ───
export async function getMatch(matchId: string): Promise<Match> {
  return riotFetchMatch<Match>(riotEndpoints.matchById(matchId));
}

// ─── Batch Match Fetch (chunked to respect rate limits) ───
const MATCH_BATCH_SIZE = 10;

export async function getMatches(matchIds: string[]): Promise<Match[]> {
  const allMatches: Match[] = [];

  for (let i = 0; i < matchIds.length; i += MATCH_BATCH_SIZE) {
    const batch = matchIds.slice(i, i + MATCH_BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((id) => getMatch(id)));
    for (const r of results) {
      if (r.status === "fulfilled") allMatches.push(r.value);
    }
  }

  return allMatches;
}

// ─── Player Matches (with pagination + optional startTime) ───
export async function getPlayerMatches(
  puuid: string,
  queue = QUEUE_FLEX,
  count = 10,
  start = 0,
  startTime?: number,
): Promise<Match[]> {
  const matchIds = await getMatchIds(puuid, queue, count, start, startTime);
  return getMatches(matchIds);
}

// ─── All Season Matches for a player ───
export async function getAllSeasonMatches(
  puuid: string,
  queue = QUEUE_FLEX,
): Promise<Match[]> {
  const matchIds = await getAllSeasonMatchIds(puuid, queue);
  return getMatches(matchIds);
}

// ─── Player Ranked Data (flex entry + summoner for profile icon) ───
export async function getPlayerRankedData(
  puuid: string,
  gameName: string,
  tagLine: string,
): Promise<PlayerRankedData> {
  try {
    const [entries, summoner] = await Promise.all([
      getRankedEntries(puuid),
      getSummoner(puuid).catch(() => null),
    ]);
    const flexEntry = getFlexEntry(entries);
    return { puuid, gameName, tagLine, summoner, flexEntry };
  } catch (error) {
    console.error(`Error fetching ranked data for ${gameName}:`, error);
    return { puuid, gameName, tagLine, summoner: null, flexEntry: null };
  }
}

// ─── All Players Ranked Data ───
export async function getAllPlayersRankedData(): Promise<PlayerRankedData[]> {
  return Promise.all(
    users.map((user) =>
      getPlayerRankedData(user.puuid, user.gameName, user.tagLine),
    ),
  );
}

// ─── Dashboard Data (ranked + last match per player) ───
export async function getDashboardData(): Promise<PlayerDashboardData[]> {
  const rankedData = await getAllPlayersRankedData();

  const withLastMatch = await Promise.all(
    rankedData.map(async (player) => {
      try {
        const matchIds = await getMatchIds(player.puuid, QUEUE_FLEX, 1, 0);
        const lastMatch =
          matchIds.length > 0 ? await getMatch(matchIds[0]) : null;
        return { ...player, lastMatch };
      } catch {
        return { ...player, lastMatch: null };
      }
    }),
  );

  return withLastMatch;
}

// ─── Player Full Data (all season matches + ranked) ───
export async function getPlayerFullData(
  puuid: string,
  gameName: string,
  tagLine: string,
): Promise<{ ranked: PlayerRankedData; matches: Match[] }> {
  const [ranked, matches] = await Promise.all([
    getPlayerRankedData(puuid, gameName, tagLine),
    getAllSeasonMatches(puuid, QUEUE_FLEX),
  ]);
  return { ranked, matches };
}
