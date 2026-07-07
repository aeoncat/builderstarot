"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { DrawnCard } from "@/components/cards/drawn-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { selectDailyDraw } from "@/lib/daily";
import { guestStore } from "@/lib/guestStore";
import { getLocalDateKey } from "@/lib/time";
import type { CardDTO, OrientationType } from "@/lib/types";

type DailyResponse = {
  dateKey: string;
  orientation: OrientationType;
  card: CardDTO;
};

export default function DailyPage() {
  const { data: sessionData } = authClient.useSession();
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDaily() {
      setLoadError(null);

      if (sessionData?.user) {
        const response = await fetch("/api/daily");
        if (!response.ok) {
          setLoadError("Unable to load daily card right now.");
          return;
        }
        setDaily((await response.json()) as DailyResponse);
        return;
      }

      const dateKey = getLocalDateKey();
      const existing = guestStore.getDaily();
      const cardsResponse = await fetch("/api/cards");
      if (!cardsResponse.ok) {
        setLoadError("Unable to load card data right now.");
        return;
      }

      let cards: CardDTO[];
      try {
        cards = (await cardsResponse.json()) as CardDTO[];
      } catch (error) {
        console.error("Failed to parse /api/cards response", error);
        setLoadError("Unable to load card data right now.");
        return;
      }

      if (existing) {
        const card = cards.find((item) => item.id === existing.cardId);
        if (!card) return;
        setDaily({ dateKey, card, orientation: existing.orientation as OrientationType });
        return;
      }

      // Same deck filter + deterministic selection as the authenticated route.
      const { card, orientation } = selectDailyDraw(cards, `guest:${dateKey}`);
      if (!card) {
        setLoadError("No cards available.");
        return;
      }
      guestStore.setDaily({ dateKey, cardId: card.id, orientation });
      setDaily({ dateKey, card, orientation });
    }

    void loadDaily();
  }, [sessionData?.user]);

  async function saveDailyToJournal() {
    if (!daily) return;

    if (sessionData?.user) {
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
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Today</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Daily Card</h1>
      </div>
      <p className="text-sm text-[#9d98a8]">
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
        <Card>{loadError ?? "Loading your daily card..."}</Card>
      )}
    </div>
  );
}
