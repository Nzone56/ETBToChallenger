"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/app/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { users } from "@/app/data/users";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/team", label: "Team Analytics", icon: Users },
];

export default function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isPlayerPage = pathname.startsWith("/player/");
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setPlayerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current player name from URL if on player page
  const currentPlayerName = isPlayerPage
    ? decodeURIComponent(pathname.split("/player/")[1]?.split("/")[0] ?? "")
    : null;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-tight text-white">
            ETB to Challenger
          </span>
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}

          {/* Player dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setPlayerDropdownOpen(!playerDropdownOpen)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                isPlayerPage
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
              )}
            >
              <User className="h-3.5 w-3.5" />
              {currentPlayerName ?? "Players"}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  playerDropdownOpen && "rotate-180",
                )}
              />
            </button>

            {playerDropdownOpen && (
              <div className="animate-slide-down absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl z-50">
                {users.map((user) => {
                  const href = `/player/${encodeURIComponent(user.gameName)}`;
                  const isActive = currentPlayerName === user.gameName;
                  return (
                    <button
                      key={user.puuid}
                      onClick={() => {
                        router.push(href);
                        setPlayerDropdownOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                      )}
                    >
                      <User className="h-3 w-3" />
                      {user.gameName}
                      <span className="ml-auto text-[10px] text-zinc-600">
                        #{user.tagLine}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="animate-slide-down border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md sm:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}

            {/* Players section in mobile */}
            <div className="pt-2 border-t border-zinc-800">
              <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Players
              </span>
              <div className="mt-1 space-y-0.5">
                {users.map((user) => {
                  const href = `/player/${encodeURIComponent(user.gameName)}`;
                  const isActive = currentPlayerName === user.gameName;
                  return (
                    <button
                      key={user.puuid}
                      onClick={() => {
                        router.push(href);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                      )}
                    >
                      <User className="h-3.5 w-3.5" />
                      {user.gameName}
                      <span className="ml-auto text-[10px] text-zinc-600">
                        #{user.tagLine}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
