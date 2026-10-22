import { Suspense } from "react";
import NavLinks from "./NavLinks";
import RosterNav, { RosterNavSkeleton } from "./RosterNav";
import SyncStatus from "./SyncStatus";

/**
 * Everything the sidebar holds below the brand: sections, roster, sync
 * status. Rendered by both the desktop sidebar and the mobile drawer so the
 * two can never list different things.
 *
 * The roster and sync time stream in behind their own Suspense boundaries —
 * the shell never waits for data, so navigation paints immediately.
 */
export default function NavPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3">
        <NavLinks />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <p className="mb-2 px-5 text-[11px] font-medium uppercase tracking-wider text-faint">
          Roster
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <Suspense fallback={<RosterNavSkeleton />}>
            <RosterNav />
          </Suspense>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Suspense fallback={null}>
          <SyncStatus />
        </Suspense>
      </div>
    </div>
  );
}
