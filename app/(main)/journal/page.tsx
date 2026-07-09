"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { ProPrompt } from "@/components/validation/pro-prompt";
import { guestStore, type GuestJournalEntry } from "@/lib/guestStore";
import type { JournalEntryDTO } from "@/lib/types";

type Row = {
  id: string;
  spreadType: string;
  createdAt: string;
  cardCount: number;
};

export default function JournalPage() {
  const { data: sessionData } = authClient.useSession();
  const [entries, setEntries] = useState<Row[]>([]);

  useEffect(() => {
    async function load() {
      if (sessionData?.user) {
        const response = await fetch("/api/journal");
        if (!response.ok) return;
        const data = (await response.json()) as JournalEntryDTO[];
        setEntries(
          data.map((item) => ({
            id: item.id,
            spreadType: item.spreadType,
            createdAt: item.createdAt,
            cardCount: item.cards.length,
          })),
        );
        return;
      }

      const guestEntries = guestStore.getJournal();
      setEntries(
        guestEntries.map((item: GuestJournalEntry) => ({
          id: item.id,
          spreadType: item.spreadType,
          createdAt: item.createdAt,
          cardCount: item.cards.length,
        })),
      );
    }

    void load();
  }, [sessionData?.user]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Archive</p>
        <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Journal</h1>
      </div>
      <ProPrompt placement="journal" />
      <div className="grid gap-3">
        {entries.map((entry) => (
          <Link href={`/journal/${entry.id}`} key={entry.id}>
            <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="font-display text-lg font-black capitalize text-[#f1eee7]">{entry.spreadType}</h2>
              <p className="mt-2 text-sm text-[#9d98a8]">
                {new Date(entry.createdAt).toLocaleString()} / {entry.cardCount} card(s)
              </p>
            </Card>
          </Link>
        ))}
      </div>
      {entries.length === 0 ? <Card>No entries yet. Draw cards and save reflections.</Card> : null}
    </div>
  );
}
