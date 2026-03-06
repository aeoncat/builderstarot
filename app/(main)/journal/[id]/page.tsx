"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const { data: session } = useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [entry, setEntry] = useState<EntryState | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function load() {
      if (!params.id) return;

      if (session?.user) {
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
      const allCards = (await cardsResponse.json()) as Array<{
        id: string;
        name: string;
        uprightMeaning: string;
        reversedMeaning: string;
        promptQuestions: string[];
      }>;

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
  }, [params.id, session?.user]);

  async function saveNotes() {
    if (!entry) return;

    if (session?.user) {
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

    if (session?.user) {
      await fetch(`/api/journal/${entry.id}`, { method: "DELETE" });
    } else {
      guestStore.deleteJournal(entry.id);
    }

    router.push("/journal");
    router.refresh();
  }

  if (!entry) {
    return <Card>Loading entry...</Card>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold capitalize">{entry.spreadType} reading</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
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
        <h2 className="font-semibold">Notes</h2>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="flex gap-2">
          <Button onClick={saveNotes}>Save Notes</Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete Entry
          </Button>
        </div>
      </Card>
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this journal entry?">
        <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone.</p>
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
