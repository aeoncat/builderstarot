import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ARCANA_LABELS, RANK_LABELS, SUIT_LABELS } from "@/lib/domain";
import type { CardDTO } from "@/lib/types";

export function CardTile({ card }: { card: CardDTO & { favorited?: boolean } }) {
  return (
    <Link href={`/cards/${card.id}`}>
      <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge>{ARCANA_LABELS[card.arcana]}</Badge>
          {card.suit ? <Badge>{SUIT_LABELS[card.suit]}</Badge> : null}
          {card.rank ? <Badge>{RANK_LABELS[card.rank] ?? card.rank}</Badge> : null}
        </div>
        <h3 className="font-semibold">{card.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{card.uprightMeaning}</p>
      </Card>
    </Link>
  );
}
