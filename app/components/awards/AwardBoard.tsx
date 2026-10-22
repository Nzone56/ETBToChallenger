"use client";

import { useState } from "react";
import { Star, Trophy } from "lucide-react";
import EmptyState from "@/app/components/ui/EmptyState";
import MoreButton from "@/app/components/ui/MoreButton";
import { Panel } from "@/app/components/ui/Panel";
import SectionHeader from "@/app/components/ui/SectionHeader";
import SegmentedControl from "@/app/components/ui/SegmentedControl";
import { ROLE_META } from "@/app/components/ui/RoleIcon";
import NomineeCard from "./NomineeCard";
import NomineeRow from "./NomineeRow";
import { AWARD_ROLE_KEYS, type AwardRoleKey, type NomineeView } from "./nomineeViews";

const INITIAL_ROWS = 7;

interface AwardBoardProps {
  title: string;
  description: string;
  /** Which award family — decides the icon. Icons can't cross the server/client boundary as props. */
  kind: "players" | "picks";
  /** Label for the all-roles category, e.g. "MVP" */
  overallLabel: string;
  categories: Record<AwardRoleKey, NomineeView[]>;
  version: string;
}

const ICONS = { players: Trophy, picks: Star };

/** One award family: pick a category, see its podium and the rest of the field. */
export default function AwardBoard({ title, description, kind, overallLabel, categories, version }: AwardBoardProps) {
  const [category, setCategory] = useState<AwardRoleKey>("overall");
  const [showAll, setShowAll] = useState(false);
  const nominees = categories[category];
  const podium = nominees.slice(0, 3);
  const rest = nominees.slice(3);
  const visibleRest = showAll ? rest : rest.slice(0, INITIAL_ROWS);

  const options = AWARD_ROLE_KEYS.map((k) => ({
    value: k,
    label: k === "overall" ? overallLabel : ROLE_META[k].label,
    disabled: categories[k].length === 0,
  }));

  return (
    <section>
      <SectionHeader
        icon={ICONS[kind]}
        title={title}
        description={description}
        actions={
          <SegmentedControl
            options={options}
            value={category}
            onChange={(v) => {
              setCategory(v);
              setShowAll(false);
            }}
            ariaLabel={`${title} category`}
          />
        }
      />
      {nominees.length === 0 ? (
        <Panel>
          <EmptyState title="Nobody qualifies yet" />
        </Panel>
      ) : (
        <div key={category} className="space-y-4">
          <div className="appear-children grid grid-cols-1 items-start gap-4 pt-3 md:grid-cols-3">
            {/* Podium order on wide screens: 2nd · 1st · 3rd */}
            {podium.map((n, i) => (
              <div key={n.key} className={i === 0 ? "md:order-2" : i === 1 ? "md:order-1" : "md:order-3"}>
                <NomineeCard nominee={n} place={i as 0 | 1 | 2} version={version} />
              </div>
            ))}
          </div>
          {rest.length > 0 && (
            <Panel>
              <ol className="divide-y divide-border">
                {visibleRest.map((n, i) => (
                  <NomineeRow key={n.key} nominee={n} place={i + 4} version={version} />
                ))}
              </ol>
              {rest.length > INITIAL_ROWS && (
                <MoreButton onClick={() => setShowAll((v) => !v)} expanded={showAll}>
                  {showAll ? "Show fewer" : `Show all ${nominees.length} nominees`}
                </MoreButton>
              )}
            </Panel>
          )}
        </div>
      )}
    </section>
  );
}
