"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { guestStore } from "@/lib/guestStore";

type CardPreview = {
  id: string;
  name: string;
};

export function GuestDailyPreview() {
  const [card, setCard] = useState<CardPreview | null>(null);
  const [dateKey, setDateKey] = useState("");

  useEffect(() => {
    const daily = guestStore.getDaily();
    if (!daily) return;

    setDateKey(daily.dateKey);

    void fetch(`/api/cards/${daily.cardId}`)
      .then((response) => response.json())
      .then((json) => {
        setCard({ id: json.id as string, name: json.name as string });
      });
  }, []);

  if (!card) return null;

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">Today&apos;s Daily Card</h2>
      <Link href="/daily">
        <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-md">
          <CardTitle>{card.name}</CardTitle>
          <CardDescription className="mt-2">Drawn {dateKey}</CardDescription>
        </Card>
      </Link>
    </section>
  );
}
