import {
  Crosshair,
  HeartPulse,
  Shield,
  Sparkles,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { POSITION_LABELS } from "@/app/data/constants";
import type { Position } from "@/app/types/riot";
import { cn } from "@/app/lib/utils";

/** Role identity: label, icon and categorical colour, in one place. */
export const ROLE_META: Record<
  Position,
  { label: string; short: string; icon: LucideIcon; text: string; fill: string }
> = {
  TOP: { label: POSITION_LABELS.TOP, short: "TOP", icon: Shield, text: "text-role-top", fill: "bg-role-top" },
  JUNGLE: { label: POSITION_LABELS.JUNGLE, short: "JGL", icon: Trees, text: "text-role-jungle", fill: "bg-role-jungle" },
  MIDDLE: { label: POSITION_LABELS.MIDDLE, short: "MID", icon: Sparkles, text: "text-role-mid", fill: "bg-role-mid" },
  BOTTOM: { label: POSITION_LABELS.BOTTOM, short: "ADC", icon: Crosshair, text: "text-role-adc", fill: "bg-role-adc" },
  UTILITY: { label: POSITION_LABELS.UTILITY, short: "SUP", icon: HeartPulse, text: "text-role-support", fill: "bg-role-support" },
};

export const ROLE_ORDER: Position[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export function isPosition(value: string): value is Position {
  return value in ROLE_META;
}

export function roleLabel(position: string): string {
  return isPosition(position) ? ROLE_META[position].label : position || "—";
}

export default function RoleIcon({
  position,
  className,
}: {
  position: string;
  className?: string;
}) {
  if (!isPosition(position)) return null;
  const { icon: Icon, text, label } = ROLE_META[position];
  return <Icon className={cn("size-3.5", text, className)} aria-label={label} />;
}
