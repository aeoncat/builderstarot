"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import { CardIcon } from "@/components/cards/card-icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORIENTATION_LABELS } from "@/lib/domain";
import { interpretDrawnCard } from "@/lib/interpret";
import { type PositionRole, roleForPositionName } from "@/lib/position-roles";
import type { OrientationType } from "@/lib/types";

type DrawnCardData = {
  id: string;
  name: string;
  uprightMeaning: string;
  reversedMeaning: string;
  promptQuestions: string[];
};

export function DrawnCard({
  card,
  orientation,
  positionName,
  index,
  role,
}: {
  card: DrawnCardData;
  orientation: OrientationType;
  positionName: string;
  index: number;
  /** Semantic role for the interpretation engine; defaults to a lookup by
   *  position name (covers stored/legacy names), then "insight". */
  role?: PositionRole;
}) {
  const reading = useMemo(
    () =>
      interpretDrawnCard({
        card,
        orientation,
        role: role ?? roleForPositionName(positionName),
        positionLabel: positionName,
        seed: `${card.id}:${positionName}:${orientation}`,
      }),
    [card, orientation, positionName, role],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateY: 40 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="h-full">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge>{positionName}</Badge>
          <Badge className={orientation === "REVERSED" ? "border-[#6d3144] bg-[#1d1018] text-[#e08aa5]" : ""}>
            {ORIENTATION_LABELS[orientation]}
          </Badge>
        </div>
        <div className="tarot-card-face my-5 flex aspect-[2/3] max-h-[360px] flex-col items-center justify-between rounded-[18px] px-6 py-7 text-center">
          <p className="font-display text-[0.66rem] font-black uppercase tracking-[0.36em] text-[#8e6d32]">
            {orientation === "REVERSED" ? "rev" : "up"}
          </p>
          <CardIcon cardName={card.name} className="h-12 w-12" strokeWidth={3} />
          <div>
            <h3 className="font-display text-2xl font-black text-[#d0a657]">{card.name}</h3>
            <p className="mt-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#9d98a8]">{positionName}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-[#d5cfda]">{reading.interpretation}</p>
        {reading.nextAction ? (
          <div className="mt-3 rounded-lg border border-[#312a1c] bg-[#1b1710] p-3">
            <h4 className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Next action</h4>
            <p className="mt-1 text-sm leading-6 text-[#d5cfda]">{reading.nextAction}</p>
          </div>
        ) : null}
        {reading.reflectionQuestion ? (
          <p className="mt-3 text-sm italic leading-6 text-[#9d98a8]">{reading.reflectionQuestion}</p>
        ) : null}
      </Card>
    </motion.div>
  );
}
