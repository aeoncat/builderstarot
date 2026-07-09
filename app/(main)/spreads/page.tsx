"use client";

import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { track, trackReadingCompleted } from "@/lib/analytics/client";
import { DrawnCard } from "@/components/cards/drawn-card";
import { ReadingSynthesis } from "@/components/cards/reading-synthesis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SPREADS } from "@/lib/domain";
import { guestStore } from "@/lib/guestStore";
import { drawnCardSeed, interpretDrawnCard } from "@/lib/interpret";
import { roleForPositionName } from "@/lib/position-roles";
import { synthesizeReading } from "@/lib/synthesis";
import type { DrawResult } from "@/lib/types";

type DrawWithSession = DrawResult & { spreadSessionId?: string | null };

export default function SpreadsPage() {
  const { data: sessionData } = authClient.useSession();
  const [spreadKey, setSpreadKey] = useState<keyof typeof SPREADS>("three");
  const [allowReversed, setAllowReversed] = useState(true);
  const [result, setResult] = useState<DrawWithSession | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function drawSpread() {
    const spread = SPREADS[spreadKey];
    const surface = spread.key === "three" ? "three" : spread.key === "five" ? "five" : "single";
    setBusy(true);
    setResult(null);

    track("reading_started", { surface, spreadSize: spread.positions.length, authed: Boolean(sessionData?.user) });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await fetch("/api/draw", {
      method: "POST",
      body: JSON.stringify({
        spreadType: spread.key,
        positions: spread.positions.map((position) => position.label),
        reversedChance: allowReversed ? guestStore.getSettings().defaultReversedChance : 0,
      }),
    });

    if (!response.ok) {
      setBusy(false);
      return;
    }

    const data = (await response.json()) as DrawWithSession;
    setResult(data);
    setBusy(false);

    trackReadingCompleted(`spread:${data.cards.map((item) => item.card.id).join("-")}:${Date.now()}`, "reading_completed", {
      surface,
      spreadSize: spread.positions.length,
      authed: Boolean(sessionData?.user),
      reversedCount: data.cards.filter((item) => item.orientation === "REVERSED").length,
    });
  }

  async function saveSpreadToJournal() {
    if (!result) return;

    track("journal_entry_saved", {
      surface: spreadKey === "three" ? "three" : spreadKey === "five" ? "five" : "single",
      authed: Boolean(sessionData?.user),
    });

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

    if (sessionData?.user) {
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

  // Resolve each drawn card's role and next action once, so the individual card
  // (via DrawnCard, same role + seed) and the synthesis stay in lockstep.
  const readings = useMemo(() => {
    if (!result) return [];
    const resultSpread = Object.values(SPREADS).find((item) => item.key === result.spreadType);
    return result.cards.map((item) => {
      const role =
        resultSpread?.positions.find((position) => position.label === item.positionName)?.role ??
        roleForPositionName(item.positionName);
      const reading = interpretDrawnCard({
        card: item.card,
        orientation: item.orientation,
        role,
        positionLabel: item.positionName,
        seed: drawnCardSeed(item.card.id, item.positionName, item.orientation),
      });
      return { role, nextAction: reading.nextAction };
    });
  }, [result]);

  const synthesis = useMemo(() => {
    if (!result || result.cards.length < 2 || readings.length !== result.cards.length) return null;
    const cards = result.cards.map((item, index) => ({
      cardId: item.card.id,
      name: item.card.name,
      orientation: item.orientation,
      role: readings[index].role,
      positionLabel: item.positionName,
      nextAction: readings[index].nextAction,
    }));
    const seed = `${result.spreadType}:${cards.map((card) => `${card.cardId}:${card.orientation}`).join("|")}`;
    return synthesizeReading({ cards, spreadType: result.spreadType, subject: "this project", seed });
  }, [result, readings]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Layouts</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Spreads</h1>
      </div>
      <Card className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#d5cfda]">Spread type</label>
          <Select value={spreadKey} onChange={(event) => setSpreadKey(event.target.value as keyof typeof SPREADS)}>
            {Object.values(SPREADS).map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#f1eee7]">Allow reversed cards</span>
          <Switch checked={allowReversed} onCheckedChange={setAllowReversed} />
        </div>
        <p className="text-sm text-[#9d98a8]">Positions: {spread.positions.map((position) => position.label).join(" / ")}</p>
        <Button onClick={drawSpread} disabled={busy}>
          {busy ? "Ritual in progress..." : "Draw Spread"}
        </Button>
      </Card>

      {result ? (
        <div className="space-y-4">
          {synthesis ? <ReadingSynthesis synthesis={synthesis.synthesis} title="What the Cards Say Together" /> : null}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {result.cards.map((item, index) => (
              <DrawnCard
                key={`${item.card.id}-${item.positionName}`}
                card={item.card}
                orientation={item.orientation}
                positionName={item.positionName}
                index={index}
                role={readings[index]?.role}
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
