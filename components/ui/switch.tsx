"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "gold-focus relative h-6 w-11 rounded-lg border border-[#3d3322] transition-colors",
        checked ? "bg-[#d0a657]" : "bg-[#17151f]",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-md bg-[#f1eee7] transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
