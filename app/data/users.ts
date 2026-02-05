import { User } from "../types/user";

export const users: User[] = [
  {
    puuid:
      "Lew8f08JKDp8zuprECqsPOt53zc4rLSMTkeofDStoTBA9eVZfz9UiU766uThwsJscSLd7OyBvNI1dg",
    gameName: "Kushinada Lucyna",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "sHVqmm-xD140AU0hWwUf1orwnbQut2Wfcy-Esh_pcNlM4HJh-7JpdG-4-n9fdJeLcgRH-85wzGpq0Q",
    gameName: "Androw",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "AUKeetCBg3Vy-_WziJ47aqmbB-apsoxq29EFqUtEF1lE4cESiSlgibyHujYDoH7BSdXV2Ot-2xA4oQ",
    gameName: "Rukawa Kaede",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "a7432Lk32kgnMXarkZUr102gVj9kjm5sNlWnhn-mWIqPJYF-I6cFpNfRgopN4Ppqt0NtjMxwad8Bww",
    gameName: "Bloomer",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "I9MIDp6kqayQXdmlegU1EttXVi1a5zwSVSSUegfasQd69Rsjd3o6fICVdSMu8OcPClnBZp60JUZyvw",
    gameName: "StarboyXO",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "iSiwseyhWvVyByjzc76ZJkKRbI-L8Iy7IfCKw4AhDJp12AzKnsUt8REPymtEC9zaRh96XRsz7fF2vg",
    gameName: "7Fabian",
    tagLine: "ETB",
    region: "LA1",
  },
  {
    puuid:
      "7MtBeRYv1zMMWKzH3jfAWRAq5dJP2SX4Qgb1NnoAdzu2JuI9c5gx4Is_Xr7RszRvaIxA",
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
