"use client";

import { useEffect, useMemo, useState } from "react";

import { CardTile } from "@/components/cards/card-tile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ARCANA_LABELS, RANK_LABELS, SUIT_LABELS } from "@/lib/domain";
import { guestStore } from "@/lib/guestStore";
import { ARCANA_VALUES, RANK_VALUES, SUIT_VALUES, type CardDTO } from "@/lib/types";

type ApiCard = CardDTO & { favorited?: boolean };

export default function CardsPage() {
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [search, setSearch] = useState("");
  const [arcana, setArcana] = useState<string>("");
  const [suit, setSuit] = useState<string>("");
  const [rank, setRank] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (arcana) params.set("arcana", arcana);
        if (suit) params.set("suit", suit);
        if (rank) params.set("rank", rank);

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
  }, [search, arcana, suit, rank]);

  const title = useMemo(() => (loading ? "Loading cards..." : `${cards.length} cards`), [cards.length, loading]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Card Library</h1>
      <Card className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Search card name or meaning" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={arcana} onChange={(e) => setArcana(e.target.value)}>
          <option value="">All arcana</option>
          {ARCANA_VALUES.map((value) => (
            <option key={value} value={value}>
              {ARCANA_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select value={suit} onChange={(e) => setSuit(e.target.value)}>
          <option value="">All suits</option>
          {SUIT_VALUES.map((value) => (
            <option key={value} value={value}>
              {SUIT_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select value={rank} onChange={(e) => setRank(e.target.value)}>
          <option value="">All ranks</option>
          {RANK_VALUES.map((value) => (
            <option key={value} value={value}>
              {RANK_LABELS[value] ?? value}
            </option>
          ))}
        </Select>
      </Card>
      <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
