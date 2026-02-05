import { User } from "../types/user";

export const users: User[] = [
  {
    puuid:
      "lFyi_2UFJ-PMBJ08NTvWFX9XkUWHRr_XWMm4b3-Pa0xUDSMagvDmBwvi5t_cQBYS01LD06jQMM7fhQ",
    gameName: "Kushinada Lucyna",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "o-eueo_Rj3kNgxS_gsEGqe4NNpnDff7zkBVBegb2ExHZgcj9LAUmxD75drbOAytQ7zKJgF8qYX5Gmg",
    gameName: "Androw",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "11oD1XEZFGtPP3XbD5U6MwlXu8BCBl2y0J3WLBRGPfZ4IUT7Z2BuvF3Mg5HLl6KMSFkkp0ItuNeqZA",
    gameName: "Rukawa Kaede",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "CvuR8LbbBF1ZsbgVww1Db_c4dCNi_F-RSTaG__FPQEmhNthP3B4cieAmNBu-pdX-tNkM5iEt6LOQrg",
    gameName: "Bloomer",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "DTj7M1_aQ5JFUNJUTWgnA5oQNr-ugLzM2kzRwZw71zgd-n2R5x4gl0FKwpcT0JE-HlVbcDFhbVInHA",
    gameName: "StarboyXO",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "BjkZo4bvEmVaIC4QP3zF8dVROR-wd18zRuykZq3PgjXj3f0LwgMm0eF6awBVrnUIJVBgKy4iR1hAdg",
    gameName: "7Fabian",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "KtOzHG-noTJT6ZQIm41XZCzxxPUc-TrhJSOCBNyaclfwUvdzJ_SBzFMsVwFLXPIN9Zr_Hh53uUItqQ",
    gameName: "Trafalgar D Cam",
    tagLine: "ETB",
    region: "LA1",
  },
];

export function getUserByRiotId(
  gameName: string,
  tagLine: string,
): User | undefined {
  return users.find(
    (user) => user.gameName === gameName && user.tagLine === tagLine,
  );
}

export function getUserByPuuid(puuid: string): User | undefined {
  return users.find((user) => user.puuid === puuid);
}
