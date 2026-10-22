"use client";

import { useState } from "react";
import { Activity, TrendingDown, Trophy } from "lucide-react";
import type { MatchRecord } from "@/app/lib/db";
import EmptyState from "@/app/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import SectionHeader from "@/app/components/ui/SectionHeader";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { ROLE_META, ROLE_ORDER } from "@/app/components/ui/RoleIcon";
import CirLeaderboardCard from "./CirLeaderboardCard";
import { cirCategory, type CirScope } from "./RecordData";

const SCOPES: { value: CirScope; label: string }[] = [
  { value: "ALL", label: "Overall" },
  ...ROLE_ORDER.map((r) => ({ value: r as CirScope, label: ROLE_META[r].label })),
];

interface CirLeaderboardsProps {
  /** Category → records, already sorted best/worst first */
  lists: Record<string, MatchRecord[]>;
  version: string;
}

function List({ records, version, variant }: { records: MatchRecord[]; version: string; variant: "best" | "worst" }) {
  if (records.length === 0) return <EmptyState title="No games in this role yet" />;
  return (
    <div className="divide-y divide-border">
      {records.map((r, i) => (
        <CirLeaderboardCard key={r.matchId + r.puuid} record={r} rank={i + 1} version={version} variant={variant} />
      ))}
    </div>
  );
}

/** Top and worst 15 CIR games side by side, overall or for one role. */
export default function CirLeaderboards({ lists, version }: CirLeaderboardsProps) {
  const [scope, setScope] = useState<CirScope>("ALL");
  const top = lists[cirCategory("top", scope)] ?? [];
  const worst = lists[cirCategory("worst", scope)] ?? [];

  return (
    <section>
      <SectionHeader
        icon={Activity}
        title="Top & worst 15 games"
        description="Competitive Impact Rating, role-weighted · open a game for its breakdown"
        actions={<SegmentedControl options={SCOPES} value={scope} onChange={setScope} ariaLabel="Role" />}
      />
      <div key={scope} className="appear-children grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <Panel>
          <PanelHeader icon={Trophy} title="Top 15" />
          <List records={top} version={version} variant="best" />
        </Panel>
        <Panel>
          <PanelHeader icon={TrendingDown} iconClassName="text-loss" title="Worst 15" />
          <List records={worst} version={version} variant="worst" />
        </Panel>
      </div>
    </section>
  );
}
