import Image from "next/image";
import { cn } from "@/app/lib/utils";
import { getChampionIconUrl } from "@/app/data/constants";

interface ChampionIconProps {
  championName: string;
  version: string;
  size?: number;
  className?: string;
}

export default function ChampionIcon({
  championName,
  version,
  size = 40,
  className,
}: ChampionIconProps) {
  return (
    <Image
      src={getChampionIconUrl(championName, version)}
      alt={championName}
      width={size}
      height={size}
      className={cn("rounded-lg", className)}
    />
  );
}
