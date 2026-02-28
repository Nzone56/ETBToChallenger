/**
 * Utilities for fetching DDragon champion skin splash URLs.
 */

/** Returns a skin splash art URL for the given champion. If skinNumber is provided, uses that specific skin; otherwise picks a random non-default skin. */
export async function getChampionSkinUrl(
  championName: string,
  version: string,
  skinNumber?: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${championName}.json`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const skins: { num: number; name: string }[] =
      data?.data?.[championName]?.skins ?? [];

    let chosen: { num: number; name: string } | undefined;

    if (skinNumber !== undefined) {
      // Use specific skin if provided
      chosen = skins.find((s) => s.num === skinNumber);
    } else {
      // Pick a random non-default skin (num > 0), fall back to default (num 0)
      const nonDefault = skins.filter((s) => s.num > 0);
      chosen =
        nonDefault.length > 0
          ? nonDefault[Math.floor(Math.random() * nonDefault.length)]
          : skins[0];
    }

    if (!chosen) return null;
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${chosen.num}.jpg`;
  } catch {
    return null;
  }
}
