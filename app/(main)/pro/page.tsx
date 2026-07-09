"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { track, trackOnce } from "@/lib/analytics/client";
import type { ProPlanInterest } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const PLAN_OPTIONS: Array<{ value: ProPlanInterest; label: string; detail: string }> = [
  { value: "monthly_5", label: "$5 / month", detail: "Cancel anytime" },
  { value: "annual_39", label: "$39 / year", detail: "About $3.25 a month" },
  { value: "founding_lifetime_59", label: "$59 founding lifetime", detail: "Under consideration — one payment, early-supporter tier" },
  { value: "interested_but_unsure", label: "Interested, but unsure", detail: "I want to see it first" },
  { value: "would_not_pay", label: "I would not pay", detail: "The free version covers what I need" },
];

const PLANNED_FEATURES = [
  { title: "Unlimited project-stage readings", detail: "Read at every decision point, not on a budget." },
  { title: "Saved projects & recurring check-ins", detail: "Builder's Tarot remembers each project and re-reads it as it moves through stages." },
  { title: "Full searchable journal history", detail: "Every reading you save, findable forever." },
  { title: "Card patterns over time", detail: "Which cards keep showing up for this project — and what that suggests." },
  { title: "Export to Markdown or PDF", detail: "Your readings belong to you." },
  { title: "Weekly project reviews", detail: "A gentle ritual to close the week. (Further out.)" },
];

export default function ProValidationPage() {
  const [selectedPlan, setSelectedPlan] = useState<ProPlanInterest | null>(null);
  const [email, setEmail] = useState("");
  const [interviewOptIn, setInterviewOptIn] = useState(false);
  const [updatesConsent, setUpdatesConsent] = useState(false);
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [waitlistStarted, setWaitlistStarted] = useState(false);
  // Honeypot: bots fill it, humans never see it.
  const [website, setWebsite] = useState("");

  useEffect(() => {
    trackOnce("pro-page", "pro_page_viewed");
  }, []);

  function choosePlan(plan: ProPlanInterest) {
    setSelectedPlan(plan);
    // Tracked before any email is asked for, so plan-interest data is not
    // limited to completed waitlist signups.
    track("pro_plan_selected", { plan });
  }

  function onEmailFocus() {
    if (waitlistStarted) return;
    setWaitlistStarted(true);
    track("pro_waitlist_started", selectedPlan ? { plan: selectedPlan } : {});
  }

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formState === "submitting") return;

    if (!updatesConsent) {
      setErrorMessage("Please confirm you're okay receiving Builder's Tarot updates — that's how we'll tell you about Pro.");
      setFormState("error");
      return;
    }

    setFormState("submitting");
    setErrorMessage("");

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        planPreference: selectedPlan ?? "interested_but_unsure",
        interviewOptIn,
        updatesConsent,
        website,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      setErrorMessage("Could not join the waitlist right now. Please try again in a moment.");
      setFormState("error");
      return;
    }

    setFormState("success");
    track("pro_waitlist_joined", selectedPlan ? { plan: selectedPlan } : {});
    if (interviewOptIn) {
      track("interview_interest_submitted", { source: "waitlist" });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Badge>Being validated — not for sale yet</Badge>
        <h1 className="mt-3 font-display text-4xl font-black text-[#f1eee7]">Builder&apos;s Tarot Pro remembers your projects.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9d98a8]">
          The free readings aren&apos;t going anywhere. Pro is the version we&apos;re <em>considering</em> for people who
          want continuity: projects the deck remembers, history you can search, and patterns that only show up over
          time. Everything below is <strong className="text-[#d5cfda]">planned, not built</strong> — your interest
          decides whether we build it.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-black text-[#f1eee7]">What Pro would include</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {PLANNED_FEATURES.map((feature) => (
            <li key={feature.title} className="rounded-lg border border-[#312a1c] bg-[#0b0a12]/62 p-3">
              <p className="text-sm font-black text-[#d5cfda]">
                {feature.title} <span className="ml-1 text-[0.6rem] font-black uppercase tracking-[0.16em] text-[#d0a657]">planned</span>
              </p>
              <p className="mt-1 text-sm leading-5 text-[#9d98a8]">{feature.detail}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-black text-[#f1eee7]">Which option would you most seriously consider?</h2>
        <div className="grid gap-2">
          {PLAN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => choosePlan(option.value)}
              className={cn(
                "gold-focus rounded-lg border p-3 text-left transition-colors",
                selectedPlan === option.value
                  ? "border-[#d0a657] bg-[#d0a657]/10"
                  : "border-[#312a1c] bg-[#0b0a12]/62 hover:border-[#d0a657]/50",
              )}
            >
              <span className="text-sm font-black text-[#f1eee7]">{option.label}</span>
              <span className="ml-2 text-sm text-[#9d98a8]">{option.detail}</span>
            </button>
          ))}
        </div>
        <p className="text-xs leading-5 text-[#9d98a8]">
          Honest answers help most — &quot;I would not pay&quot; is genuinely useful information.
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-black text-[#f1eee7]">Join the Pro waitlist</h2>
        <p className="text-sm leading-6 text-[#9d98a8]">
          Pro is not available yet. Joining the waitlist does not start a subscription or charge you — it just tells
          us you&apos;d want to hear when (and if) Pro ships.
        </p>
        {formState === "success" ? (
          <div className="rounded-lg border border-[#d0a657]/40 bg-[#d0a657]/10 p-4 text-sm leading-6 text-[#d5cfda]">
            You&apos;re on the list. We&apos;ll email you only about Builder&apos;s Tarot — no spam, and you can ask to
            be removed anytime by replying to any email.
          </div>
        ) : (
          <form className="space-y-3" onSubmit={joinWaitlist}>
            <div>
              <label htmlFor="waitlist-email" className="mb-1 block text-sm font-medium text-[#d5cfda]">
                Email
              </label>
              <Input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onFocus={onEmailFocus}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <input
              type="text"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <label className="flex items-start gap-2 text-sm leading-5 text-[#d5cfda]">
              <input
                type="checkbox"
                checked={updatesConsent}
                onChange={(event) => setUpdatesConsent(event.target.checked)}
                className="mt-0.5"
              />
              I&apos;m okay receiving Builder&apos;s Tarot product updates at this address. (Required — it&apos;s how
              we&apos;d tell you about Pro.)
            </label>
            <label className="flex items-start gap-2 text-sm leading-5 text-[#d5cfda]">
              <input
                type="checkbox"
                checked={interviewOptIn}
                onChange={(event) => setInterviewOptIn(event.target.checked)}
                className="mt-0.5"
              />
              I&apos;m open to a short (15-minute) conversation about what would make Pro worth paying for.
            </label>
            {formState === "error" && errorMessage ? (
              <p className="text-sm font-semibold text-[#e08aa5]">{errorMessage}</p>
            ) : null}
            <Button type="submit" disabled={formState === "submitting"}>
              {formState === "submitting" ? "Joining..." : "Join the Pro waitlist"}
            </Button>
          </form>
        )}
        <p className="text-xs leading-5 text-[#9d98a8]">
          We store your email and plan preference, nothing else. No payment details are collected. See our{" "}
          <Link href="/privacy" className="underline">
            privacy note
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
