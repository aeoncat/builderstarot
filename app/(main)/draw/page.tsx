"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { DrawnCard } from "@/components/cards/drawn-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { guestStore } from "@/lib/guestStore";
import type { DrawResult } from "@/lib/types";

export default function DrawPage() {
  const { data: session } = useSession();
  const [reversedEnabled, setReversedEnabled] = useState(true);
  const [reversedChance, setReversedChance] = useState(30);
  const [loading, setLoading] = useState(false);
  const [ritual, setRitual] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const settings = guestStore.getSettings();
    setReversedChance(settings.defaultReversedChance);
  }, []);

  async function handleDraw() {
    setLoading(true);
    setRitual(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 850));

    const response = await fetch("/api/draw", {
      method: "POST",
      body: JSON.stringify({
        spreadType: "single",
        positions: ["Insight"],
        reversedChance: reversedEnabled ? reversedChance : 0,
      }),
    });
    const data = (await response.json()) as DrawResult & { spreadSessionId?: string | null };

    setResult(data);
    setLoading(false);
    setRitual(false);
  }

  async function saveToJournal() {
    if (!result) return;

    const payload = {
      spreadType: "single",
      notes,
      cards: result.cards.map((item) => ({
        cardId: item.card.id,
        positionName: item.positionName,
        orientation: item.orientation,
      })),
    };

    if (session?.user) {
      await fetch("/api/journal", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return;
    }

    guestStore.saveJournal({
      id: crypto.randomUUID(),
      spreadType: "single",
      notes,
      createdAt: new Date().toISOString(),
      cards: result.cards.map((item) => ({
        cardId: item.card.id,
        cardName: item.card.name,
        positionName: item.positionName,
        orientation: item.orientation,
      })),
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Single Draw</h1>
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Allow reversed cards</span>
          <Switch checked={reversedEnabled} onCheckedChange={setReversedEnabled} />
        </div>
        <div className="space-y-1">
          <label htmlFor="reversedChance" className="text-sm font-medium">
            Reversed chance: {reversedChance}%
          </label>
          <input
            id="reversedChance"
            type="range"
            min={0}
            max={100}
            value={reversedChance}
            onChange={(e) => setReversedChance(Number(e.target.value))}
            className="w-full"
            disabled={!reversedEnabled}
          />
        </div>
        <Button onClick={handleDraw} disabled={loading}>
          {loading ? "Shuffling deck..." : "Draw Card"}
        </Button>
      </Card>

      {ritual ? (
        <Card>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">Shuffling... breathe, focus, and reveal.</p>
        </Card>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {result.cards.map((item, index) => (
              <DrawnCard
                key={`${item.card.id}-${item.positionName}`}
                card={item.card}
                orientation={item.orientation}
                positionName={item.positionName}
                index={index}
              />
            ))}
          </div>
          <Card className="space-y-3">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional reflection notes..." />
            <Button onClick={saveToJournal}>Save to Journal</Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
