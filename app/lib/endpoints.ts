const AMERICAS = "https://americas.api.riotgames.com";
const LA1 = "https://la1.api.riotgames.com";

export const riotEndpoints = {
  // ─── Account ───
  accountByRiotId: (gameName: string, tagLine: string) =>
    `${AMERICAS}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,

  // ─── Summoner ───
  summonerByPuuid: (puuid: string) =>
    `${LA1}/lol/summoner/v4/summoners/by-puuid/${puuid}`,

  // ─── Ranked / League ───
  rankedByPuuid: (puuid: string) =>
    `${LA1}/lol/league/v4/entries/by-puuid/${puuid}`,

  // ─── Match V5 ───
  matchIdsByPuuid: (
    puuid: string,
    queue = 440,
    count = 20,
    start = 0,
    startTime?: number,
  ) =>
    `${AMERICAS}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${queue}&count=${count}&start=${start}${startTime ? `&startTime=${startTime}` : ""}`,

  matchById: (matchId: string) => `${AMERICAS}/lol/match/v5/matches/${matchId}`,

  // ─── DDragon (static assets, no API key needed) ───
  championIcon: (championName: string, version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`,

  profileIcon: (iconId: number, version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`,

  ddragonVersions: () =>
    `https://ddragon.leagueoflegends.com/api/versions.json`,
};
