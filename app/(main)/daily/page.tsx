"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { DrawnCard } from "@/components/cards/drawn-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { guestStore } from "@/lib/guestStore";
import { deterministicIndex } from "@/lib/random";
import { getLocalDateKey } from "@/lib/time";
import type { CardDTO, OrientationType } from "@/lib/types";

type DailyResponse = {
  dateKey: string;
  orientation: OrientationType;
  card: CardDTO;
};

export default function DailyPage() {
  const { data: session } = useSession();
  const [daily, setDaily] = useState<DailyResponse | null>(null);

  useEffect(() => {
    async function loadDaily() {
      if (session?.user) {
        const response = await fetch("/api/daily");
        if (!response.ok) return;
        setDaily((await response.json()) as DailyResponse);
        return;
      }

      const dateKey = getLocalDateKey();
      const existing = guestStore.getDaily();
      const cards = (await (await fetch("/api/cards")).json()) as CardDTO[];

      if (existing) {
        const card = cards.find((item) => item.id === existing.cardId);
        if (!card) return;
        setDaily({ dateKey, card, orientation: existing.orientation as OrientationType });
        return;
      }

      const index = deterministicIndex(`guest:${dateKey}`, cards.length);
      const orientation: OrientationType =
        deterministicIndex(`guest:${dateKey}:orientation`, 100) < 30 ? "REVERSED" : "UPRIGHT";
      const card = cards[index];
      guestStore.setDaily({ dateKey, cardId: card.id, orientation });
      setDaily({ dateKey, card, orientation });
    }

    void loadDaily();
  }, [session?.user]);

  async function saveDailyToJournal() {
    if (!daily) return;

    if (session?.user) {
      await fetch("/api/journal", {
        method: "POST",
        body: JSON.stringify({
          spreadType: "daily",
          notes: "",
          cards: [
            {
              cardId: daily.card.id,
              positionName: "Daily Insight",
              orientation: daily.orientation,
            },
          ],
        }),
      });
      return;
    }

    guestStore.saveJournal({
      id: crypto.randomUUID(),
      spreadType: "daily",
      notes: "",
      createdAt: new Date().toISOString(),
      cards: [
        {
          cardId: daily.card.id,
          cardName: daily.card.name,
          positionName: "Daily Insight",
          orientation: daily.orientation,
        },
      ],
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Daily Card</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Deterministic daily draw. Refreshing will return the same card for the day.
      </p>
      {daily ? (
        <div className="space-y-3">
          <DrawnCard card={daily.card} orientation={daily.orientation} positionName="Daily Insight" index={0} />
          <Card>
            <Button onClick={saveDailyToJournal}>Save Daily to Journal</Button>
          </Card>
        </div>
      ) : (
        <Card>Loading your daily card...</Card>
      )}
    </div>
  );
}
