"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={!isDark}
      disabled={!mounted}
      className="gold-focus inline-flex items-center gap-2.5 rounded-lg bg-transparent px-0 py-0.5 text-sm text-[#d5cfda]"
    >
      <span
        className={`relative inline-flex h-7 w-12 items-center rounded-lg border border-[#3d3322] transition-colors ${
          isDark ? "bg-[#d0a657]" : "bg-[#17151f]"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-md bg-[#f1eee7] shadow-sm transition-transform ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      <span className="hidden font-black sm:inline">theme</span>
    </button>
  );
}
