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
      {
        next: { revalidate: 604800 }, // 7 days - DDragon data is stable
        cache: "force-cache", // Aggressive caching for production stability
      },
    );
    if (!res.ok) {
      console.warn(
        `[skinUtils] Failed to fetch champion data for ${championName}: ${res.status}`,
      );
      return null;
    }
    const data = await res.json();
    const skins: { num: number; name: string }[] =
      data?.data?.[championName]?.skins ?? [];

    if (skins.length === 0) {
      console.warn(`[skinUtils] No skins found for ${championName}`);
      return null;
    }

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

    if (!chosen) {
      console.warn(`[skinUtils] No valid skin chosen for ${championName}`);
      return null;
    }
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${chosen.num}.jpg`;
  } catch (error) {
    console.error(
      `[skinUtils] Error fetching skin for ${championName}:`,
      error,
    );
    return null;
  }
}
