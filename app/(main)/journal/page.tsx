"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { ProPrompt } from "@/components/validation/pro-prompt";
import { guestStore, type GuestJournalEntry } from "@/lib/guestStore";
import { formatReadingTitle } from "@/lib/readingTitle";
import type { JournalEntryDTO } from "@/lib/types";

type Row = {
  id: string;
  spreadType: string;
  projectStage: string | null;
  projectName: string | null;
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
            projectStage: item.projectStage,
            // The DB does not persist the raw project name; authed project
            // entries fall back to the stage-based title.
            projectName: null,
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
          projectStage: item.projectStage ?? null,
          projectName: item.projectName ?? null,
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
        {entries.map((entry) => {
          const { title, label } = formatReadingTitle({
            spreadType: entry.spreadType,
            projectStage: entry.projectStage,
            projectName: entry.projectName,
          });
          return (
            <Link href={`/journal/${entry.id}`} key={entry.id}>
              <Card className="transition-transform hover:-translate-y-0.5 hover:shadow-md">
                <h2 className="font-display text-lg font-black text-[#f1eee7]">{title}</h2>
                {label ? (
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#d0a657]">{label}</p>
                ) : null}
                <p className="mt-2 text-sm text-[#9d98a8]">
                  {new Date(entry.createdAt).toLocaleString()} / {entry.cardCount} card(s)
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
      {entries.length === 0 ? <Card>No entries yet. Draw cards and save reflections.</Card> : null}
    </div>
  );
}
