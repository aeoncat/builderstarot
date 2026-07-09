"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getReadingCount } from "@/lib/analytics/visitor";
import type { EmotionalRegister } from "@/lib/card-content";
import type { ProjectStageKey } from "@/lib/projectStages";
import { PRO_PROMPT_LAST_SHOWN_KEY, shouldShowProPrompt } from "@/lib/validation/gates";

/**
 * Subtle, non-blocking Pro discovery. Never shown before the first reading,
 * never mid-reading, never after emotionally difficult readings
 * (Burnout/Doubt stage or gravity-dominant draws), and at most once per
 * 7 days. Emphasizes continuity, not urgency.
 */
export function ProPrompt({
  placement,
  stage,
  registers,
}: {
  placement: "post_save" | "journal" | "dashboard";
  stage?: ProjectStageKey | null;
  registers?: readonly EmotionalRegister[];
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eligible = shouldShowProPrompt({
      completedReadings: getReadingCount(window.localStorage),
      lastShownAt: window.localStorage.getItem(PRO_PROMPT_LAST_SHOWN_KEY),
      now: new Date(),
      stage,
      registers,
    });
    if (eligible) {
      window.localStorage.setItem(PRO_PROMPT_LAST_SHOWN_KEY, new Date().toISOString());
      setVisible(true);
    }
  }, [stage, registers]);

  if (!visible) return null;

  return (
    <div className="rounded-lg border border-[#d0a657]/40 bg-[#d0a657]/5 p-4 text-sm leading-6 text-[#d5cfda]">
      Want Builder&apos;s Tarot to remember this project over time?{" "}
      <Link href={`/pro?from=${placement}`} className="font-semibold text-[#d0a657] underline">
        See what we&apos;re considering for Pro
      </Link>
      . <span className="text-[#9d98a8]">Nothing is for sale yet — we&apos;re deciding what to build.</span>
    </div>
  );
}
