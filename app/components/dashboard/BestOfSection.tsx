"use client";

import { useState } from "react";
import { Medal, ThumbsDown, ThumbsUp } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import MoreButton from "@/app/components/ui/MoreButton";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { MIN_GAMES_FOR_BEST } from "@/app/data/constants";
import { BestOfChallenge } from "@/app/types/riot";
import { CARD_CONFIGS } from "./statCardConfigs";
import StatCard from "./StatCard";

const INITIAL_VISIBLE = 8;

type Side = "best" | "worst";

const SIDES = [
  { value: "best", label: "Best", icon: ThumbsUp },
  { value: "worst", label: "Worst", icon: ThumbsDown },
] as const;

/** Season superlatives across the roster, best or worst. */
export default function BestOfSection({ best }: { best: BestOfChallenge }) {
  const [side, setSide] = useState<Side>("best");
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? CARD_CONFIGS : CARD_CONFIGS.slice(0, INITIAL_VISIBLE);

  return (
    <Panel>
      <PanelHeader
        icon={Medal}
        title={side === "best" ? "Best of the challenge" : "Worst of the challenge"}
        description={`Season averages · min. ${MIN_GAMES_FOR_BEST} games`}
        actions={
          <SegmentedControl options={SIDES} value={side} onChange={setSide} ariaLabel="Best or worst" />
        }
      />
      <div key={side} className="appear-children grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map((config) => (
          <StatCard key={config.key} config={config} entries={best[side][config.key]} variant={side} />
        ))}
      </div>
      <MoreButton onClick={() => setShowAll((v) => !v)} expanded={showAll}>
        {showAll ? "Show fewer" : `Show ${CARD_CONFIGS.length - INITIAL_VISIBLE} more categories`}
      </MoreButton>
    </Panel>
  );
}
