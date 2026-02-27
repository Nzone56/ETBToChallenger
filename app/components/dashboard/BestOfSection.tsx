import { BestOfChallenge } from "@/app/types/riot";
import { WORST_LABEL_OVERRIDES } from "./statCardConfigs";
import StatCardGrid from "./StatCardGrid";

interface BestOfSectionProps {
  best: BestOfChallenge;
}

export default function BestOfSection({ best }: BestOfSectionProps) {
  return (
    <div className="space-y-6">
      <StatCardGrid title="Best of the Challenge" data={best.best} />
      <StatCardGrid
        title="Worst of the Challenge"
        data={best.worst}
        labelOverrides={WORST_LABEL_OVERRIDES}
      />
    </div>
  );
}
