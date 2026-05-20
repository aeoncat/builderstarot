import Link from "next/link";

import { CardIcon } from "@/components/cards/card-icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ARCANA_LABELS } from "@/lib/domain";
import type { CardDTO } from "@/lib/types";

export function CardTile({ card }: { card: CardDTO & { favorited?: boolean } }) {
  return (
    <Link href={`/cards/${card.id}`}>
      <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge>{ARCANA_LABELS[card.arcana]}</Badge>
        </div>
        <div className="tarot-card-face my-5 flex aspect-[2/3] flex-col items-center justify-center gap-6 rounded-[18px] px-5 text-center">
          <CardIcon cardName={card.name} className="h-12 w-12" />
          <h3 className="font-display text-xl font-black text-[#d0a657]">{card.name}</h3>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-[#9d98a8]">{card.uprightMeaning}</p>
      </Card>
    </Link>
  );
}
