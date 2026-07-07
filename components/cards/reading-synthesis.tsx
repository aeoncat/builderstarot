"use client";

import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import type { SpreadSynthesis } from "@/lib/synthesis-render";

/**
 * Compact "Reading Together" panel for multi-card readings (Phase 3). Shows the
 * synthesis headline, combined summary, and an optional priority action. The
 * individual card interpretations remain visible elsewhere in the flow.
 */
export function ReadingSynthesis({
  synthesis,
  title = "Reading Together",
}: {
  synthesis: SpreadSynthesis;
  title?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* No custom background: Card's default panel is theme-remapped in
          globals.css, so light mode stays readable. A gold accent border (not
          remapped) distinguishes the synthesis panel in both themes. */}
      <Card className="space-y-3 border-[#d0a657]/40">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">{title}</p>
        <h3 className="font-display text-2xl font-black text-[#f1eee7]">{synthesis.headline}</h3>
        <p className="text-sm leading-6 text-[#d5cfda]">{synthesis.summary}</p>
        {synthesis.priorityAction ? (
          <div className="rounded-lg border border-[#312a1c] bg-[#1b1710] p-3">
            <h4 className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Start here</h4>
            <p className="mt-1 text-sm leading-6 text-[#d5cfda]">{synthesis.priorityAction}</p>
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
