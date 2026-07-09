"use client";

import { useEffect } from "react";

import { trackVisit } from "@/lib/analytics/client";

/** Ensures a visitor id exists and emits return_visit on a new calendar day. */
export function AnalyticsBootstrap() {
  useEffect(() => {
    trackVisit();
  }, []);
  return null;
}
