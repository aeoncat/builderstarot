"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { DrawnCard } from "@/components/cards/drawn-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { track, trackReadingCompleted } from "@/lib/analytics/client";
import { guestStore } from "@/lib/guestStore";
import type { DrawResult } from "@/lib/types";

export default function DrawPage() {
  const { data: sessionData } = authClient.useSession();
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

    track("reading_started", { surface: "single", authed: Boolean(sessionData?.user) });

    await new Promise((resolve) => setTimeout(resolve, 850));

    const response = await fetch("/api/draw", {
      method: "POST",
      body: JSON.stringify({
        spreadType: "single",
        positions: ["Insight"],
        reversedChance: reversedEnabled ? reversedChance : 0,
      }),
    });
    if (!response.ok) {
      // Failed requests never count as completed readings.
      setLoading(false);
      setRitual(false);
      return;
    }
    const data = (await response.json()) as DrawResult & { spreadSessionId?: string | null };

    setResult(data);
    setLoading(false);
    setRitual(false);

    trackReadingCompleted(`single:${data.cards.map((item) => item.card.id).join("-")}:${Date.now()}`, "reading_completed", {
      surface: "single",
      authed: Boolean(sessionData?.user),
      reversedCount: data.cards.filter((item) => item.orientation === "REVERSED").length,
    });
  }

  async function saveToJournal() {
    if (!result) return;

    track("journal_entry_saved", { surface: "single", authed: Boolean(sessionData?.user) });

    const payload = {
      spreadType: "single",
      notes,
      cards: result.cards.map((item) => ({
        cardId: item.card.id,
        positionName: item.positionName,
        orientation: item.orientation,
      })),
    };

    if (sessionData?.user) {
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
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Reading</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Single Draw</h1>
      </div>
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#f1eee7]">Allow reversed cards</span>
          <Switch checked={reversedEnabled} onCheckedChange={setReversedEnabled} />
        </div>
        <div className="space-y-1">
          <label htmlFor="reversedChance" className="text-sm font-medium text-[#d5cfda]">
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
          <p className="text-center text-sm text-[#9d98a8]">Shuffling. Breathe, focus, and reveal.</p>
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
