import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavHeader from "./components/ui/NavHeader";
import Spinner from "./components/ui/Spinner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ETB to Challenger",
  description: "Road to Challenger challenge tracker for Flex Queue",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#09090b] text-zinc-50`}
      >
        <NavHeader />
        <Suspense
          fallback={
            <main className="flex min-h-[60vh] items-center justify-center">
              <Spinner size="lg" label="Loading..." />
            </main>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  );
}
