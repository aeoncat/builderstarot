"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { DrawnCard } from "@/components/cards/drawn-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trackOnce } from "@/lib/analytics/client";
import { guestStore, type GuestJournalEntry } from "@/lib/guestStore";
import { formatReadingTitle } from "@/lib/readingTitle";
import type { JournalEntryDTO } from "@/lib/types";

type EntryState = {
  id: string;
  spreadType: string;
  projectStage: string | null;
  projectName: string | null;
  createdAt: string;
  notes: string;
  synthesisHeadline?: string | null;
  synthesisSummary?: string | null;
  synthesisPriorityAction?: string | null;
  cards: Array<{
    positionName: string;
    orientation: "UPRIGHT" | "REVERSED";
    // Snapshot text when the entry preserved the exact rendered reading;
    // entries without snapshots fall back to live engine rendering.
    interpretationText?: string | null;
    nextActionText?: string | null;
    reflectionQuestionText?: string | null;
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
          projectStage: data.projectStage,
          // Not persisted server-side; authed entries use the stage-based title.
          projectName: null,
          createdAt: data.createdAt,
          notes: data.userNotes,
          synthesisHeadline: data.synthesisHeadline,
          synthesisSummary: data.synthesisSummary,
          synthesisPriorityAction: data.synthesisPriorityAction,
          cards: data.cards.map((item) => ({
            positionName: item.positionName,
            orientation: item.orientation,
            interpretationText: item.interpretationText,
            nextActionText: item.nextActionText,
            reflectionQuestionText: item.reflectionQuestionText,
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
        projectStage: guestEntry.projectStage ?? null,
        projectName: guestEntry.projectName ?? null,
        createdAt: guestEntry.createdAt,
        notes: guestEntry.notes,
        synthesisHeadline: guestEntry.synthesisHeadline,
        synthesisSummary: guestEntry.synthesisSummary,
        synthesisPriorityAction: guestEntry.synthesisPriorityAction,
        cards: guestEntry.cards
          .map((item) => {
            const card = allCards.find((candidate) => candidate.id === item.cardId);
            if (!card) return null;
            return {
              positionName: item.positionName,
              orientation: item.orientation,
              interpretationText: item.interpretationText ?? null,
              nextActionText: item.nextActionText ?? null,
              reflectionQuestionText: item.reflectionQuestionText ?? null,
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

  useEffect(() => {
    if (!entry) return;
    // "Saved project reading reopened" maps to journal_entry_viewed with
    // hasSnapshot=true (see docs/validation-plan.md event mapping).
    trackOnce(`journal-view:${entry.id}`, "journal_entry_viewed", {
      hasSnapshot: entry.cards.some((item) => Boolean(item.interpretationText)),
    });
  }, [entry]);

  if (!entry) {
    return <Card className="text-[#9d98a8]">Loading entry...</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Journal</p>
        {(() => {
          const { title, label } = formatReadingTitle({
            spreadType: entry.spreadType,
            projectStage: entry.projectStage,
            projectName: entry.projectName,
          });
          return (
            <>
              <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">{title}</h1>
              {label ? (
                <p className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-[#d0a657]">{label}</p>
              ) : null}
            </>
          );
        })()}
      </div>
      <p className="text-sm text-[#9d98a8]">{new Date(entry.createdAt).toLocaleString()}</p>
      {entry.synthesisHeadline && entry.synthesisSummary ? (
        <Card className="space-y-2 border-[#d0a657]/40">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Reading together</p>
          <h2 className="font-display text-2xl font-black text-[#f1eee7]">{entry.synthesisHeadline}</h2>
          <p className="text-sm leading-6 text-[#d5cfda]">{entry.synthesisSummary}</p>
          {entry.synthesisPriorityAction ? (
            <div className="rounded-lg border border-[#312a1c] bg-[#1b1710] p-3">
              <h3 className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Start here</h3>
              <p className="mt-1 text-sm leading-6 text-[#d5cfda]">{entry.synthesisPriorityAction}</p>
            </div>
          ) : null}
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {entry.cards.map((item, index) =>
          item.interpretationText ? (
            // Snapshot entry: show the exact reading the user saved.
            <Card key={`${item.card.id}-${item.positionName}`} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge>{item.positionName}</Badge>
                <Badge className={item.orientation === "REVERSED" ? "border-[#6d3144] bg-[#1d1018] text-[#e08aa5]" : ""}>
                  {item.orientation === "REVERSED" ? "Reversed" : "Upright"}
                </Badge>
              </div>
              <h3 className="font-display text-xl font-black text-[#d0a657]">{item.card.name}</h3>
              <p className="text-sm leading-6 text-[#d5cfda]">{item.interpretationText}</p>
              {item.nextActionText ? (
                <div className="rounded-lg border border-[#312a1c] bg-[#1b1710] p-3">
                  <h4 className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Next action</h4>
                  <p className="mt-1 text-sm leading-6 text-[#d5cfda]">{item.nextActionText}</p>
                </div>
              ) : null}
              {item.reflectionQuestionText ? (
                <p className="text-sm italic leading-6 text-[#9d98a8]">{item.reflectionQuestionText}</p>
              ) : null}
            </Card>
          ) : (
            // Pre-snapshot entry: fall back to live engine rendering.
            <DrawnCard
              key={`${item.card.id}-${item.positionName}`}
              card={item.card}
              orientation={item.orientation}
              positionName={item.positionName}
              index={index}
            />
          ),
        )}
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
