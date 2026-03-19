"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { guestStore } from "@/lib/guestStore";

export function FavoriteToggle({ cardId, initial }: { cardId: string; initial: boolean }) {
  const { data: sessionData } = authClient.useSession();
  const [favorited, setFavorited] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionData?.user) {
      setFavorited(guestStore.isFavorite(cardId));
    }
  }, [cardId, sessionData?.user]);

  async function toggle() {
    if (busy) return;

    setBusy(true);
    try {
      if (!sessionData?.user) {
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
