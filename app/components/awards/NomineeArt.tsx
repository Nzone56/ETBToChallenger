import ChampionIcon from "@/app/components/ui/ChampionIcon";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import type { NomineeView } from "./nomineeViews";

/** A nominee's picture: the player's avatar, or the champion for a pick. */
export default function NomineeArt({ art, version, size }: { art: NomineeView["art"]; version: string; size: number }) {
  return art.kind === "avatar" ? (
    <ProfileIcon iconId={art.iconId} version={version} size={size} />
  ) : (
    <ChampionIcon championName={art.name} version={version} size={size} className="rounded-full" />
  );
}
