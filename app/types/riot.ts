// ─── Riot Account API ───
export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

// ─── Summoner API ───
export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

// ─── League / Ranked API ───
export type RankTier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER";

export type RankDivision = "I" | "II" | "III" | "IV";

export interface LeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string; // "RANKED_FLEX_SR" | "RANKED_SOLO_5x5"
  tier: RankTier;
  rank: RankDivision;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

// ─── Match V5 API ───
export interface MatchMetadata {
  dataVersion: string;
  matchId: string;
  participants: string[]; // puuids
}

export interface MatchParticipant {
  puuid: string;
  summonerName: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championId: number;
  championName: string;
  champLevel: number;
  teamId: number;
  teamPosition: string; // "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY"
  individualPosition: string;
  role: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  goldEarned: number;
  goldSpent: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    statPerks: { defense: number; flex: number; offense: number };
    styles: {
      description: string;
      selections: { perk: number; var1: number; var2: number; var3: number }[];
      style: number;
    }[];
  };
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  firstBloodKill: boolean;
  turretKills: number;
  inhibitorKills: number;
}

export interface MatchTeam {
  teamId: number;
  win: boolean;
  bans: { championId: number; pickTurn: number }[];
  objectives: Record<string, { first: boolean; kills: number }>;
}

export interface MatchInfo {
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: MatchParticipant[];
  platformId: string;
  queueId: number;
  teams: MatchTeam[];
}

export interface Match {
  metadata: MatchMetadata;
  info: MatchInfo;
}

// ─── Aggregated / Computed Types ───
export type Position = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export interface PlayerRankedData {
  puuid: string;
  gameName: string;
  tagLine: string;
  summoner: Summoner | null;
  flexEntry: LeagueEntry | null;
}

export interface PlayerDashboardData extends PlayerRankedData {
  lastMatch: Match | null;
}

export interface ChampionStats {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKda: number;
  avgDamage: number;
}

export interface RoleStats {
  position: Position;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
}

export interface PlayerAggregatedStats {
  totalGames: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKda: number;
  avgCs: number;
  avgCsPerMin: number;
  avgDamage: number;
  avgVisionScore: number;
  avgKillParticipation: number;
  championStats: ChampionStats[];
  roleStats: RoleStats[];
  primaryRole: Position | null;
}

export interface BestOfChallenge {
  topWinrate: { gameName: string; value: number; games: number } | null;
  topKda: { gameName: string; value: number; games: number } | null;
  topDamage: { gameName: string; value: number; games: number } | null;
  bestChampion: {
    gameName: string;
    championName: string;
    winrate: number;
    games: number;
  } | null;
  mostAvgKills: { gameName: string; value: number; games: number } | null;
  leastAvgDeaths: { gameName: string; value: number; games: number } | null;
  mostAvgAssists: { gameName: string; value: number; games: number } | null;
  topKillParticipation: {
    gameName: string;
    value: number;
    games: number;
  } | null;
}
