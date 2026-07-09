"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "Home" },
  { href: "/cards", label: "Cards" },
  { href: "/draw", label: "Draw" },
  { href: "/daily", label: "Daily" },
  { href: "/spreads", label: "Spreads" },
  { href: "/readings/project-stage", label: "Project" },
  { href: "/journal", label: "Journal" },
  { href: "/pro", label: "Pro" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sessionData } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
    setSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#211d18] bg-[#06050b]/[0.94] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-3 px-4 py-5">
        <Link href="/" className="whitespace-nowrap font-display text-[1.2rem] font-black tracking-normal text-[#d0a657]">
          BuildersTarot
          <span className="ml-4 hidden whitespace-nowrap align-middle text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#827c8e] lg:inline">
            for builders
          </span>
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-semibold text-[#9d98a8] transition-colors hover:text-[#e0bc72]",
                pathname === item.href && "bg-[#17151f] text-[#f1eee7]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {sessionData?.user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? "Logging out..." : "Log out"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="whitespace-nowrap rounded-lg border border-[#3d3322] bg-[#17151f] px-2.5 py-1.5 text-xs font-black text-[#d5cfda] transition-colors hover:text-[#f1eee7] sm:px-3"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="whitespace-nowrap rounded-lg bg-[#d0a657] px-2.5 py-1.5 text-xs font-black text-[#090810] transition-colors hover:bg-[#e0bc72] sm:px-3"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
      <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t border-[#211d18] px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-[#9d98a8] transition-colors hover:text-[#e0bc72]",
              pathname === item.href && "bg-[#17151f] text-[#f1eee7]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
