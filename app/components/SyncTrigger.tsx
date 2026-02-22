"use client";

import { useEffect, useRef } from "react";

interface SyncTriggerProps {
  dbEmpty: boolean;
  syncedAt?: number | null; // unix ms of last sync (from DB)
}

// Re-sync when data is older than 15 minutes
const SYNC_INTERVAL_MS = 15 * 60 * 1000;

// Fires POST /api/sync whenever data is stale (>15min) or DB is empty.
// Deduplication is handled server-side via syncInProgress lock.
// After a successful sync with new matches, reloads the page so ISR serves fresh data.
export default function SyncTrigger({ dbEmpty, syncedAt }: SyncTriggerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    const isStale =
      dbEmpty || !syncedAt || Date.now() - syncedAt > SYNC_INTERVAL_MS;
    if (!isStale) return;
    if (hasFired.current) return;
    hasFired.current = true;

    const ageS = syncedAt
      ? Math.round((Date.now() - syncedAt) / 60_000) + "min"
      : "unknown";
    console.log(`[SyncTrigger] Firing sync (dbEmpty=${dbEmpty}, age=${ageS})`);

    fetch("/api/sync", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.skipped) {
          console.log("[SyncTrigger] Server already syncing — skipped");
          return;
        }
        const newMatches = data.totalNew ?? 0;
        console.log(`[SyncTrigger] Done — ${newMatches} new matches`);
        // Reload whenever sync ran (new matches found OR DB was empty)
        if (dbEmpty || newMatches > 0) {
          window.location.reload();
        }
      })
      .catch((err) => {
        console.error("[SyncTrigger] Error:", err);
        hasFired.current = false; // allow retry on next render
      });
  }, [dbEmpty, syncedAt]);

  // If DB is empty, poll every 20s until snapshots appear, then reload
  useEffect(() => {
    if (!dbEmpty) return;
    const interval = setInterval(() => {
      fetch("/api/sync")
        .then((r) => r.json())
        .then((d) => {
          if (d.db?.snapshotCount > 0) {
            clearInterval(interval);
            window.location.reload();
          }
        })
        .catch(() => {});
    }, 20_000);
    return () => clearInterval(interval);
  }, [dbEmpty]);

  return null;
}
