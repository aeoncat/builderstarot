"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { guestStore } from "@/lib/guestStore";

export function FavoriteToggle({ cardId, initial }: { cardId: string; initial: boolean }) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setFavorited(guestStore.isFavorite(cardId));
    }
  }, [cardId, session?.user]);

  async function toggle() {
    if (busy) return;

    setBusy(true);
    try {
      if (!session?.user) {
        setFavorited(guestStore.toggleFavorite(cardId).includes(cardId));
        return;
      }

      const response = await fetch(`/api/favorites/${cardId}`, { method: "POST" });
      const json = (await response.json()) as { favorited: boolean };
      setFavorited(json.favorited);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={favorited ? "secondary" : "outline"} size="sm" onClick={toggle} disabled={busy}>
      <Heart className={`mr-2 h-4 w-4 ${favorited ? "fill-current" : ""}`} />
      {favorited ? "Favorited" : "Favorite"}
    </Button>
  );
}
