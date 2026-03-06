"use client";

import { getLocalDateKey } from "@/lib/time";

const FAVORITES_KEY = "bt_guest_favorites";
const JOURNAL_KEY = "bt_guest_journal";
const DAILY_KEY = "bt_guest_daily";
const SETTINGS_KEY = "bt_settings";

export type GuestJournalCard = {
  cardId: string;
  cardName: string;
  positionName: string;
  orientation: "UPRIGHT" | "REVERSED";
};

export type GuestJournalEntry = {
  id: string;
  spreadType: string;
  notes: string;
  createdAt: string;
  cards: GuestJournalCard[];
};

export type GuestDailyRecord = {
  dateKey: string;
  cardId: string;
  orientation: "UPRIGHT" | "REVERSED";
};

export type GuestSettings = {
  defaultReversedChance: number;
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const guestStore = {
  getFavorites() {
    return safeRead<string[]>(FAVORITES_KEY, []);
  },
  toggleFavorite(cardId: string) {
    const favorites = this.getFavorites();
    const next = favorites.includes(cardId)
      ? favorites.filter((id) => id !== cardId)
      : [...favorites, cardId];
    safeWrite(FAVORITES_KEY, next);
    return next;
  },
  isFavorite(cardId: string) {
    return this.getFavorites().includes(cardId);
  },
  getJournal() {
    return safeRead<GuestJournalEntry[]>(JOURNAL_KEY, []);
  },
  saveJournal(entry: GuestJournalEntry) {
    const entries = this.getJournal();
    safeWrite(JOURNAL_KEY, [entry, ...entries]);
  },
  updateJournal(entryId: string, notes: string) {
    const entries = this.getJournal().map((entry) =>
      entry.id === entryId ? { ...entry, notes } : entry,
    );
    safeWrite(JOURNAL_KEY, entries);
  },
  deleteJournal(entryId: string) {
    const entries = this.getJournal().filter((entry) => entry.id !== entryId);
    safeWrite(JOURNAL_KEY, entries);
  },
  getJournalEntry(entryId: string) {
    return this.getJournal().find((entry) => entry.id === entryId) ?? null;
  },
  getDaily(date = new Date()) {
    const dateKey = getLocalDateKey(date);
    const daily = safeRead<GuestDailyRecord[]>(DAILY_KEY, []);
    return daily.find((record) => record.dateKey === dateKey) ?? null;
  },
  setDaily(record: GuestDailyRecord) {
    const daily = safeRead<GuestDailyRecord[]>(DAILY_KEY, []);
    const filtered = daily.filter((item) => item.dateKey !== record.dateKey);
    safeWrite(DAILY_KEY, [...filtered, record]);
  },
  getSettings() {
    return safeRead<GuestSettings>(SETTINGS_KEY, { defaultReversedChance: 30 });
  },
  setSettings(settings: GuestSettings) {
    safeWrite(SETTINGS_KEY, settings);
  },
};
