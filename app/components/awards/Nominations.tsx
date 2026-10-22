import { PICK_AWARD_MIN_GAMES, ROLE_AWARD_MIN_GAMES } from "@/app/lib/awards";
import type { AwardCategories } from "./awardCategories";
import AwardBoard from "./AwardBoard";
import ScoreFormula from "./ScoreFormula";

/** Every nominee, per award family and category. */
export default function Nominations({
  roles,
  picks,
  version,
}: {
  roles: AwardCategories;
  picks: AwardCategories;
  version: string;
}) {
  return (
    <div className="space-y-12">
      <AwardBoard
        kind="players"
        title="Player awards"
        description={`Ranked by performance score · min. ${ROLE_AWARD_MIN_GAMES} games in role`}
        overallLabel="MVP"
        categories={roles}
        version={version}
      />
      <AwardBoard
        kind="picks"
        title="Signature picks"
        description={`Top 20 player–champion pairings · min. ${PICK_AWARD_MIN_GAMES} games`}
        overallLabel="Overall"
        categories={picks}
        version={version}
      />
      <ScoreFormula />
    </div>
  );
}
