import Image from "next/image";
import { cn } from "@/app/lib/utils";
import { getProfileIconUrl } from "@/app/data/constants";

interface ProfileIconProps {
  iconId: number | null | undefined;
  version: string;
  size?: number;
  className?: string;
}

export default function ProfileIcon({
  iconId,
  version,
  size = 32,
  className,
}: ProfileIconProps) {
  if (!iconId) {
    return (
      <div
        className={cn(
          "shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={getProfileIconUrl(iconId, version)}
      alt="Profile icon"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}
