const AMERICAS = "https://americas.api.riotgames.com";
const LA1 = "https://la1.api.riotgames.com";

export const riotEndpoints = {
  accountByRiotId: (gameName: string, tagLine: string) =>
    `${AMERICAS}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,

  summonerByPuuid: (puuid: string) =>
    `${LA1}/lol/summoner/v4/summoners/by-puuid/${puuid}`,

  rankedBySummonerId: (summonerId: string) =>
    `${LA1}/lol/league/v4/entries/by-summoner/${summonerId}`,

  matchIdsByPuuid: (puuid: string, queue = 440, count = 100, start = 0) =>
    `${AMERICAS}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${queue}&count=${count}&start=${start}`,

  matchById: (matchId: string) => `${AMERICAS}/lol/match/v5/matches/${matchId}`,

  championIcon: (championName: string, version: string) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`,
};
