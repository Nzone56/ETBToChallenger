/**
 * CIR color utilities - reusable functions for CIR tier colors and labels
 */

/** Get Tailwind color class for a CIR score */
export function getCirColor(cir: number): string {
  if (cir >= 20) return "text-yellow-400";
  if (cir >= 15) return "text-orange-400";
  if (cir >= 11) return "text-emerald-400";
  if (cir >= 8) return "text-sky-400";
  if (cir >= 6) return "text-zinc-300";
  return "text-red-400";
}

/** Get CIR tier label (first letter only) */
export function getCirTierLetter(cir: number): string {
  if (cir >= 20) return "L"; // Legendary
  if (cir >= 15) return "D"; // Dominant
  if (cir >= 11) return "G"; // Great
  if (cir >= 8) return "S"; // Solid
  if (cir >= 6) return "A"; // Average
  return "P"; // Poor
}

/** Get background color class for CIR badge */
export function getCirBgColor(cir: number): string {
  if (cir >= 20) return "border-yellow-500/30 bg-yellow-500/10";
  if (cir >= 15) return "border-orange-500/30 bg-orange-500/10";
  if (cir >= 11) return "border-emerald-500/30 bg-emerald-500/10";
  if (cir >= 8) return "border-sky-500/30 bg-sky-500/10";
  if (cir >= 6) return "border-zinc-600/30 bg-zinc-800/30";
  return "border-red-500/30 bg-red-500/10";
}
