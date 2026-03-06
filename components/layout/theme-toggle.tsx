"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2.5 rounded-full bg-transparent px-0 py-0.5 text-sm text-[#d3d9e2]"
    >
      <span
        className={`relative inline-flex h-7 w-12 items-center rounded-full border border-[#4d3f28] transition-colors ${
          isDark ? "bg-[#d39a32]" : "bg-[#334767]"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-[#f7e6c0] shadow-sm transition-transform ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      <span className="font-medium">theme</span>
    </button>
  );
}
