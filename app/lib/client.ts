const API_KEY = process.env.NEXT_PUBLIC_RIOT_API_KEY_DEV!;

export async function riotFetch<T>(url: string): Promise<T> {
  console.log("Fetching from Riot API: ", url);
  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Riot API error: ${res.status}`);
  }

  return res.json();
}
