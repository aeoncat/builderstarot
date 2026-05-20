"use client";

import { useEffect, useMemo, useState } from "react";

import { CardTile } from "@/components/cards/card-tile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { guestStore } from "@/lib/guestStore";
import type { CardDTO } from "@/lib/types";

type ApiCard = CardDTO & { favorited?: boolean };

export default function CardsPage() {
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);

        const response = await fetch(`/api/cards?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load cards: ${response.status}`);
        }

        const data = (await response.json()) as ApiCard[];
        const guestFavorites = new Set(guestStore.getFavorites());

        setCards(
          data.map((card) => ({
            ...card,
            favorited: card.favorited ?? guestFavorites.has(card.id),
          })),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error(error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [search]);

  const title = useMemo(() => (loading ? "Loading cards..." : `${cards.length} cards`), [cards.length, loading]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Archive</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Card Library</h1>
      </div>
      <Card>
        <Input placeholder="Search the 22 creator archetypes" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>
      <p className="text-sm text-[#9d98a8]">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
