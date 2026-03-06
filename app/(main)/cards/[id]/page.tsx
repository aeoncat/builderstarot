import { notFound } from "next/navigation";

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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{card.name}</h1>
      <div className="flex flex-wrap gap-2">
        <Badge>{ARCANA_LABELS[cardView.arcana]}</Badge>
        {cardView.suit ? <Badge>{SUIT_LABELS[cardView.suit]}</Badge> : null}
        {cardView.rank ? <Badge>{RANK_LABELS[cardView.rank] ?? cardView.rank}</Badge> : null}
      </div>
      <FavoriteToggle cardId={card.id} initial={isFavorite} />
      <Card>
        <h2 className="font-semibold">Keywords</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{cardView.keywords.join(" • ")}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Upright Meaning</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{card.uprightMeaning}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Reversed Meaning</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{card.reversedMeaning}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Prompt Questions</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {cardView.promptQuestions.map((prompt) => (
            <li key={prompt}>• {prompt}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
