"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORIENTATION_LABELS } from "@/lib/domain";
import { meaningForOrientation } from "@/lib/serializers";
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
}: {
  card: DrawnCardData;
  orientation: OrientationType;
  positionName: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateY: 40 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="h-full">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge>{positionName}</Badge>
          <Badge className={orientation === "REVERSED" ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300" : ""}>
            {ORIENTATION_LABELS[orientation]}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold">{card.name}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {meaningForOrientation(card.uprightMeaning, card.reversedMeaning, orientation)}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {card.promptQuestions.map((prompt) => (
            <li key={prompt} className="text-slate-700 dark:text-slate-300">
              • {prompt}
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}
