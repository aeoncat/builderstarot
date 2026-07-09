"use client";

import { useEffect } from "react";

import { trackOnce } from "@/lib/analytics/client";

export function LandingTracker() {
  useEffect(() => {
    trackOnce("landing", "landing_viewed");
  }, []);
  return null;
}
