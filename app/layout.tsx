import type { Metadata } from "next";
import "./globals.css";
import { display, mono, sans } from "./fonts";
import AppShell from "./components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "ETB to Challenger",
    template: "%s · ETB to Challenger",
  },
  description: "Seven friends, one Flex queue, one goal: Challenger.",
  icons: {
    icon: "/chall.png",
    apple: "/chall.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
