import { AlertTriangle } from "lucide-react";
import Meter from "@/app/components/ui/Meter";
import DossierPanel from "./DossierPanel";

const WALL_HEIGHT = 1000;

interface BronzeWallProps {
  lpDonated: number;
  lowestCirGames: number;
  totalGames: number;
}

/** LP handed to the enemy team, and how often Rukawa was the lowest CIR on the map. */
export default function BronzeWall({ lpDonated, lowestCirGames, totalGames }: BronzeWallProps) {
  const pct = totalGames > 0 ? (lowestCirGames / totalGames) * 100 : 0;

  return (
    <DossierPanel icon={AlertTriangle} title="The Bronze Wall">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">LP donated to the enemy team</p>
        <p className="num font-display text-6xl font-semibold text-loss">{lpDonated}</p>
      </div>
      <div className="mt-4">
        <Meter value={(lpDonated / WALL_HEIGHT) * 100} fillClassName="bg-loss" size="sm" label="Bronze wall progress" />
        <p className="mt-1.5 text-center text-[11px] uppercase tracking-wider text-faint">
          {lpDonated >= WALL_HEIGHT ? "Maximum donation achieved" : "Building the wall…"}
        </p>
      </div>
      <div className="mt-5 rounded-lg border border-dossier/30 bg-dossier/5 p-4">
        <p className="text-sm font-semibold text-dossier">🎯 Who&apos;s to blame?</p>
        <p className="mt-1 text-xs text-muted-foreground">Games where Rukawa had the lowest CIR of all ten players</p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="num font-display text-3xl font-semibold text-dossier">{lowestCirGames}</span>
          <span className="num text-sm text-faint">
            / {totalGames} games ({pct.toFixed(1)}%)
          </span>
        </p>
      </div>
    </DossierPanel>
  );
}
