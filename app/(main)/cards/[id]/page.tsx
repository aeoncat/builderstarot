import { notFound } from "next/navigation";

import { CardIcon } from "@/components/cards/card-icon";
import { FavoriteToggle } from "@/components/cards/favorite-toggle";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ARCANA_LABELS, RANK_LABELS, SUIT_LABELS } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/serverAuth";
import { serializeCard } from "@/lib/serializers";

export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const [card, userId] = await Promise.all([
    prisma.card.findUnique({ where: { id: params.id } }),
    requireUserId(),
  ]);

  if (!card) notFound();
  const cardView = serializeCard(card);

  const isFavorite = userId
    ? Boolean(await prisma.favorite.findUnique({ where: { userId_cardId: { userId, cardId: card.id } } }))
    : false;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Card</p>
          <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">{card.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{ARCANA_LABELS[cardView.arcana]}</Badge>
            {cardView.suit ? <Badge>{SUIT_LABELS[cardView.suit]}</Badge> : null}
            {cardView.rank ? <Badge>{RANK_LABELS[cardView.rank] ?? cardView.rank}</Badge> : null}
          </div>
          <div className="mt-4">
            <FavoriteToggle cardId={card.id} initial={isFavorite} />
          </div>
        </div>
        <div className="tarot-card-face flex aspect-[2/3] items-center justify-center rounded-[18px]">
          <CardIcon cardName={card.name} className="h-16 w-16" strokeWidth={3} />
        </div>
      </div>
      <Card>
        <h2 className="font-display font-black text-[#f1eee7]">Keywords</h2>
        <p className="mt-2 text-sm leading-6 text-[#9d98a8]">{cardView.keywords.join(" / ")}</p>
      </Card>
      <Card>
        <h2 className="font-display font-black text-[#f1eee7]">Upright Meaning</h2>
        <p className="mt-2 text-sm leading-6 text-[#9d98a8]">{card.uprightMeaning}</p>
      </Card>
      <Card>
        <h2 className="font-display font-black text-[#f1eee7]">Reversed Meaning</h2>
        <p className="mt-2 text-sm leading-6 text-[#9d98a8]">{card.reversedMeaning}</p>
      </Card>
      <Card>
        <h2 className="font-display font-black text-[#f1eee7]">Prompt Questions</h2>
        <ul className="mt-2 space-y-1 text-sm text-[#9d98a8]">
          {cardView.promptQuestions.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
