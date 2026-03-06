"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/cards", label: "Cards" },
  { href: "/draw", label: "Draw" },
  { href: "/daily", label: "Daily" },
  { href: "/spreads", label: "Spreads" },
  { href: "/journal", label: "Journal" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-[#243248] bg-[#070f1f]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-[1.08rem] font-medium tracking-wide text-[#d7dee8]">
          Builder&apos;s Tarot
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-[1.02rem] text-[#b7beca] transition-colors hover:text-[#e2bf7f]",
                pathname === item.href &&
                  "bg-gradient-to-r from-[#6b5231] to-[#8a6130] text-[#f0cf91]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {session?.user ? (
            <Button
              variant="outline"
              size="sm"
              className="border-[#3a4658] bg-[#111b2f] text-[#d2d7df] hover:bg-[#18243a]"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Log out
            </Button>
          ) : (
            <span className="rounded-full bg-[#2f2c2a] px-3 py-1 text-xs font-medium text-[#c5c2bd]">
              guest mode
            </span>
          )}
        </div>
      </div>
      <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t border-[#243248] px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm text-[#b7beca] transition-colors hover:text-[#e2bf7f]",
              pathname === item.href &&
                "bg-gradient-to-r from-[#6b5231] to-[#8a6130] text-[#f0cf91]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
