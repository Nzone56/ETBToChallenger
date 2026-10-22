import type { Metadata } from "next";
import { Suspense } from "react";
import { BarChart3, FileWarning } from "lucide-react";
import { users } from "@/app/data/users";
import { getDdragonVersion } from "@/app/lib/service";
import {
  getCirRoleAverages,
  getGroupMatchCount,
  getGroupMatches,
  getGroupMatchWins,
  getLatestSyncedAt,
} from "@/app/lib/db";
import { toGroupMatchRows } from "@/app/lib/groupMatches";
import { loadRoster } from "@/app/lib/roster";
import { getRukawaAnalytics } from "@/app/lib/rukawaAnalytics";
import PageHeader from "@/app/components/layout/PageHeader";
import PageSkeleton from "@/app/components/layout/PageSkeleton";
import LinkTabs from "@/app/components/ui/LinkTabs";
import TeamOverview from "@/app/components/team/TeamOverview";
import InternalRankings from "@/app/components/team/InternalRankings";
import FinalRankings from "@/app/components/team/FinalRankings";
import BestRoster from "@/app/components/team/BestRoster";
import GroupMatchHistory from "@/app/components/team/GroupMatchHistory";
import RukawaFiles from "@/app/components/team/RukawaFiles";
import SyncTrigger from "@/app/components/SyncTrigger";

export const revalidate = 900;
export const metadata: Metadata = { title: "Team" };

type View = "overview" | "rukawa";

const TABS = [
  { value: "overview", label: "Overview", href: "/team", icon: BarChart3 },
  { value: "rukawa", label: "The Rukawa Files", href: "/team?view=rukawa", icon: FileWarning },
];

async function OverviewView() {
  const puuids = users.map((u) => u.puuid);
  const [roster, groupCount, groupWins, groupMatches, cirRoleAverages, version] = await Promise.all([
    loadRoster(),
    getGroupMatchCount(),
    getGroupMatchWins(),
    getGroupMatches(),
    getCirRoleAverages(puuids),
    getDdragonVersion(),
  ]);
  const players = roster.map((p) => ({ gameName: p.gameName, profileIconId: p.profileIconId, stats: p.stats }));

  return (
    <div className="appear-children space-y-6">
      <TeamOverview players={players} totalGroupMatches={groupCount} groupWins={groupWins} version={version} />
      <BestRoster entries={cirRoleAverages} players={players} version={version} />
      <div className="grid gap-6 2xl:grid-cols-2">
        <FinalRankings players={players} version={version} />
        <InternalRankings players={players} version={version} />
      </div>
      <GroupMatchHistory rows={toGroupMatchRows(groupMatches)} />
    </div>
  );
}

async function RukawaView() {
  return <RukawaFiles analytics={await getRukawaAnalytics()} />;
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [{ view: rawView }, syncedAt] = await Promise.all([searchParams, getLatestSyncedAt()]);
  const view: View = rawView === "rukawa" ? "rukawa" : "overview";

  return (
    <div className="space-y-8">
      <SyncTrigger dbEmpty={false} syncedAt={syncedAt} />
      <PageHeader
        eyebrow="Team"
        title="Team analytics"
        description="How we do together: stacked games, the ideal lineup and who ranks where."
      />
      <LinkTabs tabs={TABS} active={view} ariaLabel="Team views" />
      <Suspense key={view} fallback={<PageSkeleton variant="content" />}>
        {view === "rukawa" ? <RukawaView /> : <OverviewView />}
      </Suspense>
    </div>
  );
}
