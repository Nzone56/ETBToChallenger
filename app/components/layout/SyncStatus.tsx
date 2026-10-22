import { RefreshCw } from "lucide-react";
import { getLatestSyncedAt } from "@/app/lib/db";
import { formatColombianDateShort, formatColombianTime } from "@/app/lib/dateUtils";

/** Season + last sync time, at the foot of the sidebar. Streams in. */
export default async function SyncStatus() {
  const syncedAt = await getLatestSyncedAt();

  return (
    <div className="space-y-1 text-[11px] text-faint">
      <p className="font-medium uppercase tracking-wider text-muted-foreground">
        Flex Queue · Season 2026
      </p>
      {syncedAt && (
        <p className="flex items-center gap-1.5">
          <RefreshCw className="size-3" />
          Synced {formatColombianDateShort(syncedAt)}, {formatColombianTime(syncedAt)}
        </p>
      )}
    </div>
  );
}
