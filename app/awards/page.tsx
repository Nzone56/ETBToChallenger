import type { Metadata } from "next";
import { Award, Lock, Trophy, Vote } from "lucide-react";
import { getAwardsData } from "@/app/lib/awards";
import { loadRoster } from "@/app/lib/roster";
import { getDdragonVersion } from "@/app/lib/service";
import PageHeader from "@/app/components/layout/PageHeader";
import LinkTabs from "@/app/components/ui/LinkTabs";
import Nominations from "@/app/components/awards/Nominations";
import WinnersBoard from "@/app/components/awards/WinnersBoard";
import { pickCategories, roleCategories } from "@/app/components/awards/awardCategories";

export const revalidate = 900;
export const metadata: Metadata = { title: "Awards" };

type Tab = "nominations" | "winners";

const TABS = [
  { value: "nominations", label: "Nominations", href: "/awards", icon: Award },
  { value: "voting", label: "Voting", href: "/awards", icon: Vote, locked: true },
  { value: "winners", label: "Winners", href: "/awards?tab=winners", icon: Trophy },
];

export default async function AwardsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab: rawTab }, data, roster, version] = await Promise.all([
    searchParams,
    getAwardsData(),
    loadRoster(),
    getDdragonVersion(),
  ]);
  const tab: Tab = rawTab === "winners" ? "winners" : "nominations";

  const iconMap = new Map(roster.map((p) => [p.puuid, p.profileIconId]));
  const roles = roleCategories(data, (puuid) => iconMap.get(puuid) ?? null);
  const picks = pickCategories(data);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Season 2026"
        title="Road to Challenger Awards"
        description="Recognising the best performers in every role, and the champions they made their own."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Voting opens at season end
          </span>
        }
      />
      <LinkTabs tabs={TABS} active={tab} ariaLabel="Award phases" />
      {tab === "winners" ? (
        <WinnersBoard roles={roles} picks={picks} version={version} />
      ) : (
        <Nominations roles={roles} picks={picks} version={version} />
      )}
    </div>
  );
}
