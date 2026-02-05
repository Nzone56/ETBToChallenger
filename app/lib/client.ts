const API_KEY =
  process.env.RIOT_API_KEY ?? process.env.NEXT_PUBLIC_RIOT_API_KEY_DEV ?? "";

// Default cache: 5 minutes for most data, configurable per call
const DEFAULT_REVALIDATE = 300;

// ─── Rate Limit Protection ───
// Riot dev keys: 20 req/s, 100 req/2min. We throttle to stay safe on cold starts.
const RATE_LIMIT_PER_SECOND = 15; // Stay under 20/s with margin
const RATE_LIMIT_WINDOW_MS = 1000;
const requestTimestamps: number[] = [];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  // Remove timestamps older than the window
  while (
    requestTimestamps.length > 0 &&
    requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS
  ) {
    requestTimestamps.shift();
  }
  // If we've hit the limit, wait until the oldest request expires
  if (requestTimestamps.length >= RATE_LIMIT_PER_SECOND) {
    const waitMs = requestTimestamps[0] + RATE_LIMIT_WINDOW_MS - now + 50;
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  requestTimestamps.push(Date.now());
}

// ─── API Request Tracker ───
let requestCount = 0;
const requestLog: { url: string; type: string; status: number; ms: number }[] =
  [];

function categorizeRequest(url: string): string {
  if (url.includes("/lol/league/")) return "RANKED";
  if (url.includes("/lol/match/") && url.includes("/ids")) return "MATCH_IDS";
  if (url.includes("/lol/match/")) return "MATCH_DETAIL";
  if (url.includes("/lol/summoner/")) return "SUMMONER";
  if (url.includes("/riot/account/")) return "ACCOUNT";
  if (url.includes("ddragon")) return "DDRAGON";
  return "OTHER";
}

export function getApiStats() {
  const byType: Record<string, number> = {};
  for (const r of requestLog) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }
  return { total: requestCount, byType, log: requestLog };
}

export function logApiSummary() {
  const stats = getApiStats();
  console.log(`\n📊 [Riot API] Total requests: ${stats.total}`);
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`   ${type}: ${count}`);
  }
  console.log("");
}

export async function riotFetch<T>(
  url: string,
  revalidate: number = DEFAULT_REVALIDATE,
): Promise<T> {
  await waitForRateLimit();

  requestCount++;
  const reqNum = requestCount;
  const type = categorizeRequest(url);
  const start = Date.now();

  console.log(`🔵 [API #${reqNum}] ${type} → ${url.split("?")[0]}`);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        "X-Riot-Token": API_KEY,
      },
      next: { revalidate },
    });

    const ms = Date.now() - start;

    // Retry on 429 (rate limited)
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
      const waitMs = Math.max(retryAfter * 1000, RETRY_DELAY_MS);
      console.log(
        `⏳ [API #${reqNum}] ${type} RATE LIMITED — retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    requestLog.push({ url, type, status: res.status, ms });

    if (!res.ok) {
      console.log(`🔴 [API #${reqNum}] ${type} FAILED ${res.status} (${ms}ms)`);
      const body = await res.text().catch(() => "");
      throw new Error(`Riot API error ${res.status}: ${body}`);
    }

    console.log(`🟢 [API #${reqNum}] ${type} OK ${res.status} (${ms}ms)`);
    return res.json();
  }

  throw new Error(
    `Riot API request failed after ${MAX_RETRIES} retries: ${url}`,
  );
}

// Longer cache for match data (matches are immutable)
export async function riotFetchMatch<T>(url: string): Promise<T> {
  return riotFetch<T>(url, 86400); // 24h — matches never change
}

// Short cache for ranked data (changes frequently)
export async function riotFetchRanked<T>(url: string): Promise<T> {
  return riotFetch<T>(url, 120); // 2 min
}
