"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { DrawnCard } from "@/components/cards/drawn-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { guestStore, type GuestJournalEntry } from "@/lib/guestStore";
import type { JournalEntryDTO } from "@/lib/types";

type EntryState = {
  id: string;
  spreadType: string;
  createdAt: string;
  notes: string;
  cards: Array<{
    positionName: string;
    orientation: "UPRIGHT" | "REVERSED";
    card: {
      id: string;
      name: string;
      uprightMeaning: string;
      reversedMeaning: string;
      promptQuestions: string[];
    };
  }>;
};

export default function JournalDetailPage() {
  const { data: sessionData } = authClient.useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [entry, setEntry] = useState<EntryState | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params.id) return;

      if (sessionData?.user) {
        const response = await fetch(`/api/journal/${params.id}`);
        if (!response.ok) return;
        const data = (await response.json()) as JournalEntryDTO;
        setEntry({
          id: data.id,
          spreadType: data.spreadType,
          createdAt: data.createdAt,
          notes: data.userNotes,
          cards: data.cards.map((item) => ({
            positionName: item.positionName,
            orientation: item.orientation,
            card: {
              id: item.card.id,
              name: item.card.name,
              uprightMeaning: item.card.uprightMeaning,
              reversedMeaning: item.card.reversedMeaning,
              promptQuestions: item.card.promptQuestions,
            },
          })),
        });
        setNotes(data.userNotes);
        return;
      }

      const guestEntry = guestStore.getJournalEntry(params.id);
      if (!guestEntry) return;

      const cardsResponse = await fetch("/api/cards");
      if (!cardsResponse.ok) {
        return;
      }

      let allCards: Array<{
        id: string;
        name: string;
        uprightMeaning: string;
        reversedMeaning: string;
        promptQuestions: string[];
      }>;

      try {
        allCards = (await cardsResponse.json()) as Array<{
          id: string;
          name: string;
          uprightMeaning: string;
          reversedMeaning: string;
          promptQuestions: string[];
        }>;
      } catch (error) {
        console.error("Failed to parse /api/cards response", error);
        return;
      }

      setGuestEntry(guestEntry, allCards);
    }

    function setGuestEntry(
      guestEntry: GuestJournalEntry,
      allCards: Array<{ id: string; name: string; uprightMeaning: string; reversedMeaning: string; promptQuestions: string[] }>,
    ) {
      setEntry({
        id: guestEntry.id,
        spreadType: guestEntry.spreadType,
        createdAt: guestEntry.createdAt,
        notes: guestEntry.notes,
        cards: guestEntry.cards
          .map((item) => {
            const card = allCards.find((candidate) => candidate.id === item.cardId);
            if (!card) return null;
            return {
              positionName: item.positionName,
              orientation: item.orientation,
              card,
            };
          })
          .filter(Boolean) as EntryState["cards"],
      });
      setNotes(guestEntry.notes);
    }

    void load();
  }, [params.id, sessionData?.user]);

  async function saveNotes() {
    if (!entry) return;

    if (sessionData?.user) {
      await fetch(`/api/journal/${entry.id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      return;
    }

    guestStore.updateJournal(entry.id, notes);
  }

  async function deleteEntry() {
    if (!entry) return;

    if (sessionData?.user) {
      await fetch(`/api/journal/${entry.id}`, { method: "DELETE" });
    } else {
      guestStore.deleteJournal(entry.id);
    }

    router.push("/journal");
    router.refresh();
  }

  if (!entry) {
    return <Card className="text-[#9d98a8]">Loading entry...</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Journal</p>
        <h1 className="mt-2 font-display text-4xl font-black capitalize text-[#f1eee7]">{entry.spreadType} Reading</h1>
      </div>
      <p className="text-sm text-[#9d98a8]">{new Date(entry.createdAt).toLocaleString()}</p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {entry.cards.map((item, index) => (
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
        <h2 className="font-display font-black text-[#f1eee7]">Notes</h2>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="flex gap-2">
          <Button onClick={saveNotes}>Save Notes</Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete Entry
          </Button>
        </div>
      </Card>
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this journal entry?">
        <p className="text-sm text-[#9d98a8]">This action cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={deleteEntry}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
