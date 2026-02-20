"use client";

import { useEffect } from "react";

interface SyncTriggerProps {
  dbEmpty: boolean;
  syncedAt?: number | null; // unix ms of last sync (from DB)
}

// Re-sync only if data is older than 15 minutes (matches page cache duration)
const SYNC_INTERVAL_MS = 15 * 60 * 1000;
// Session key — ensures only ONE sync fires per browser tab session
const SESSION_KEY = "etb_sync_fired";

// Fires a background POST /api/sync at most once per browser session,
// and only when data is stale (>15min) or the DB is empty.
// The server-side lock also blocks concurrent syncs from multiple tabs.
export default function SyncTrigger({ dbEmpty, syncedAt }: SyncTriggerProps) {
  useEffect(() => {
    const isStale =
      dbEmpty || !syncedAt || Date.now() - syncedAt > SYNC_INTERVAL_MS;
    if (!isStale) return;

    // Only use sessionStorage to deduplicate when data is NOT empty
    // (if DB is empty we must always attempt a sync)
    if (!dbEmpty && sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    console.log(
      `[SyncTrigger] Firing sync (dbEmpty=${dbEmpty}, age=${syncedAt ? Math.round((Date.now() - syncedAt) / 1000) + "s" : "unknown"})`,
    );

    fetch("/api/sync", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.skipped) {
          console.log("[SyncTrigger] Server already syncing — skipped");
          return;
        }
        console.log(`[SyncTrigger] Done — ${data.totalNew ?? 0} new matches`);
        if (dbEmpty) window.location.reload();
      })
      .catch((err) => {
        console.error("[SyncTrigger] Error:", err);
        sessionStorage.removeItem(SESSION_KEY); // allow retry on next visit
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
