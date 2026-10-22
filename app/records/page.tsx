import type { Metadata } from "next";
import { Activity, Trophy, Zap } from "lucide-react";
import { getMatchRecords, getPentakillEvents } from "@/app/lib/db";
import { getDdragonVersion } from "@/app/lib/service";
import { users } from "@/app/data/users";
import PageHeader from "@/app/components/layout/PageHeader";
import LinkTabs from "@/app/components/ui/LinkTabs";
import RecordsTab from "@/app/components/records/RecordsTab";
import CirTab from "@/app/components/records/CirTab";
import DeltaTab from "@/app/components/records/DeltaTab";
import { groupByCategory } from "@/app/components/records/RecordData";

export const revalidate = 900;
export const metadata: Metadata = { title: "Records" };

type Tab = "records" | "cir" | "delta";

const TABS = [
  { value: "records", label: "Records", href: "/records", icon: Trophy },
  { value: "cir", label: "CIR leaderboards", href: "/records?tab=cir", icon: Activity },
  { value: "delta", label: "Delta", href: "/records?tab=delta", icon: Zap },
];

function parseTab(raw: string | undefined): Tab {
  return raw === "cir" || raw === "delta" ? raw : "records";
}

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const puuids = users.map((u) => u.puuid);
  const [{ tab: rawTab }, records, pentakills, version] = await Promise.all([
    searchParams,
    getMatchRecords(puuids),
    getPentakillEvents(puuids),
    getDdragonVersion(),
  ]);
  const tab = parseTab(rawTab);
  const byCategory = groupByCategory(records);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Records"
        title="Hall of fame — and shame"
        description={`The best and worst single games across all ${users.length} players this season.`}
      />
      <LinkTabs tabs={TABS} active={tab} ariaLabel="Record views" />
      {tab === "records" && <RecordsTab byCategory={byCategory} pentakills={pentakills} version={version} />}
      {tab === "cir" && <CirTab byCategory={byCategory} version={version} />}
      {tab === "delta" && <DeltaTab byCategory={byCategory} version={version} />}
    </div>
  );
}
