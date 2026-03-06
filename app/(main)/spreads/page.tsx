"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

import { DrawnCard } from "@/components/cards/drawn-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SPREADS } from "@/lib/domain";
import { guestStore } from "@/lib/guestStore";
import type { DrawResult } from "@/lib/types";

type DrawWithSession = DrawResult & { spreadSessionId?: string | null };

export default function SpreadsPage() {
  const { data: session } = useSession();
  const [spreadKey, setSpreadKey] = useState<keyof typeof SPREADS>("three");
  const [allowReversed, setAllowReversed] = useState(true);
  const [result, setResult] = useState<DrawWithSession | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function drawSpread() {
    const spread = SPREADS[spreadKey];
    setBusy(true);
    setResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await fetch("/api/draw", {
      method: "POST",
      body: JSON.stringify({
        spreadType: spread.key,
        positions: spread.positions,
        reversedChance: allowReversed ? guestStore.getSettings().defaultReversedChance : 0,
      }),
    });

    setResult((await response.json()) as DrawWithSession);
    setBusy(false);
  }

  async function saveSpreadToJournal() {
    if (!result) return;

    const payload = {
      spreadType: result.spreadType,
      spreadSessionId: result.spreadSessionId,
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
      spreadType: result.spreadType,
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

  const spread = SPREADS[spreadKey];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Spreads</h1>
      <Card className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Spread type</label>
          <Select value={spreadKey} onChange={(event) => setSpreadKey(event.target.value as keyof typeof SPREADS)}>
            {Object.values(SPREADS).map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Allow reversed cards</span>
          <Switch checked={allowReversed} onCheckedChange={setAllowReversed} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Positions: {spread.positions.join(" · ")}</p>
        <Button onClick={drawSpread} disabled={busy}>
          {busy ? "Ritual in progress..." : "Draw Spread"}
        </Button>
      </Card>

      {result ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Capture your reading notes..." />
            <Button onClick={saveSpreadToJournal}>Save Spread to Journal</Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
