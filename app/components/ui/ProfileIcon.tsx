import { User } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getProfileIconUrl } from "@/app/data/constants";

interface ProfileIconProps {
  iconId: number | null | undefined;
  version: string;
  size?: number;
  /** Ring colour for data-driven identity (e.g. a tier colour) */
  ringColor?: string;
  className?: string;
}

/** A player's in-game profile icon — the app's avatar. */
export default function ProfileIcon({
  iconId,
  version,
  size = 32,
  ringColor,
  className,
}: ProfileIconProps) {
  const dims = {
    width: size,
    height: size,
    ...(ringColor ? { "--tw-ring-color": ringColor } : {}),
  } as React.CSSProperties;

  const base = cn(
    "shrink-0 rounded-full bg-muted ring-1 ring-border-strong",
    className,
  );

  if (!iconId) {
    return (
      <div
        className={cn(base, "flex items-center justify-center text-faint")}
        style={dims}
        aria-hidden
      >
        <User style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    <img
      src={getProfileIconUrl(iconId, version)}
      alt=""
      width={size}
      height={size}
      style={dims}
      className={base}
      loading="lazy"
    />
  );
}
