/**
 * Splash art for the player banner.
 *
 * Why the banner used to come up empty: DDragon's skin list mixes in
 * chromas ("Debonair Ezreal (Ruby)" — any entry with `parentSkin`), and
 * chromas have no splash (403). Picking a random entry often landed on one;
 * for Ezreal ~70% of entries are chromas. A few real skins are missing on
 * DDragon too, and some champions are spelled differently in match data
 * (`FiddleSticks`). So: drop chromas, normalise the id, check the image
 * exists, and fall back to the default skin.
 */
import { ddragonChampionId, getChampionSplashUrl } from "../data/constants";

interface DDragonSkin {
  num: number;
  name: string;
  parentSkin?: number;
}

const WEEK = 604800;
const MAX_ATTEMPTS = 4;

async function imageExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", next: { revalidate: WEEK } });
    return res.ok;
  } catch {
    return false;
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A splash URL that is known to load: a random real skin (or `skinNumber`),
 * else the default skin, else null.
 */
export async function getChampionSkinUrl(
  championName: string,
  version: string,
  skinNumber?: number,
): Promise<string | null> {
  const id = ddragonChampionId(championName);
  let skins: DDragonSkin[] = [];
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${id}.json`,
      { next: { revalidate: WEEK } },
    );
    if (res.ok) {
      const data = await res.json();
      skins = data?.data?.[id]?.skins ?? [];
    } else {
      console.warn(`[skinUtils] champion data ${id}: ${res.status}`);
    }
  } catch (error) {
    console.error(`[skinUtils] champion data ${id}:`, error);
  }

  const realSkins = skins.filter((s) => s.parentSkin === undefined && s.num > 0);
  const candidates =
    skinNumber !== undefined ? [skinNumber] : shuffle(realSkins.map((s) => s.num));

  for (const num of [...candidates.slice(0, MAX_ATTEMPTS), 0]) {
    const url = getChampionSplashUrl(id, num);
    if (await imageExists(url)) return url;
  }
  return null;
}
