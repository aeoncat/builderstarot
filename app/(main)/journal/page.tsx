"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Journal</h1>
      <div className="grid gap-3">
        {entries.map((entry) => (
          <Link href={`/journal/${entry.id}`} key={entry.id}>
            <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="text-base font-semibold capitalize">{entry.spreadType}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(entry.createdAt).toLocaleString()} · {entry.cardCount} card(s)
              </p>
            </Card>
          </Link>
        ))}
      </div>
      {entries.length === 0 ? <Card>No entries yet. Draw cards and save reflections.</Card> : null}
    </div>
  );
}
