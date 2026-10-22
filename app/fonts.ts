import { Chakra_Petch, Geist, Geist_Mono } from "next/font/google";

// Body and UI text.
export const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Tabular figures in tables and dense stat rows.
export const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face: page titles, section labels and hero numbers only.
export const display = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
