"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { track, trackOnce } from "@/lib/analytics/client";
import { getReadingCount } from "@/lib/analytics/visitor";
import { SURVEY_DONE_KEY, isSurveyEligible } from "@/lib/validation/gates";
import { cn } from "@/lib/utils";

const QUESTIONS = {
  changedPlans: {
    title: "Did a Builder's Tarot reading change or clarify what you planned to do next?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "somewhat", label: "Somewhat" },
      { value: "no", label: "No" },
    ],
  },
  topFeature: {
    title: "Which planned Pro feature would be most valuable?",
    options: [
      { value: "saved_projects", label: "Saved projects and recurring check-ins" },
      { value: "journal_history", label: "Full searchable journal history" },
      { value: "card_patterns", label: "Card-pattern insights over time" },
      { value: "unlimited_project_readings", label: "Unlimited project readings" },
      { value: "export", label: "Export to Markdown or PDF" },
      { value: "none", label: "None of these" },
    ],
  },
  pricePreference: {
    title: "Which pricing option would you most seriously consider?",
    options: [
      { value: "monthly_5", label: "$5 monthly" },
      { value: "annual_39", label: "$39 annually" },
      { value: "founding_lifetime_59", label: "$59 founding lifetime" },
      { value: "not_at_these_prices", label: "I might pay, but not at these prices" },
      { value: "free_only", label: "I would only use the free version" },
    ],
  },
} as const;

/**
 * One optional, dismissible survey for authenticated users with >=3 completed
 * readings. Shown at most once (localStorage flag covers both completion and
 * dismissal); no free-text collection.
 */
export function ValidationSurvey() {
  const { data: sessionData } = authClient.useSession();
  const [visible, setVisible] = useState(false);
  const [answers, setAnswers] = useState<{ changedPlans?: string; topFeature?: string; pricePreference?: string }>({});
  const [interviewOptIn, setInterviewOptIn] = useState(false);
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eligible = isSurveyEligible({
      isAuthenticated: Boolean(sessionData?.user),
      completedReadings: getReadingCount(window.localStorage),
      alreadyCompletedOrDismissed: window.localStorage.getItem(SURVEY_DONE_KEY) !== null,
    });
    if (eligible) {
      setVisible(true);
      trackOnce("survey-view", "validation_survey_viewed");
    }
  }, [sessionData?.user]);

  if (!visible) return null;

  function dismiss() {
    window.localStorage.setItem(SURVEY_DONE_KEY, "dismissed");
    setVisible(false);
  }

  async function submit() {
    if (!answers.changedPlans || !answers.topFeature || !answers.pricePreference || state === "submitting") return;
    setState("submitting");
    const response = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, interviewOptIn }),
    }).catch(() => null);

    if (!response || !response.ok) {
      setState("error");
      return;
    }

    window.localStorage.setItem(SURVEY_DONE_KEY, "completed");
    track("validation_survey_completed");
    if (interviewOptIn) {
      track("interview_interest_submitted", { source: "survey" });
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <Card className="border-[#d0a657]/40 text-sm leading-6 text-[#d5cfda]">
        Thank you — this genuinely shapes what gets built next.
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">One-minute question</p>
          <h2 className="mt-1 font-display text-xl font-black text-[#f1eee7]">
            You&apos;ve done a few readings — mind telling us what&apos;s working?
          </h2>
        </div>
        <Button type="button" variant="outline" onClick={dismiss}>
          Not now
        </Button>
      </div>

      {(Object.entries(QUESTIONS) as Array<[keyof typeof QUESTIONS, (typeof QUESTIONS)[keyof typeof QUESTIONS]]>).map(
        ([key, question]) => (
          <fieldset key={key} className="space-y-2">
            <legend className="text-sm font-black text-[#d5cfda]">{question.title}</legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAnswers((current) => ({ ...current, [key]: option.value }))}
                  className={cn(
                    "gold-focus rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    answers[key] === option.value
                      ? "border-[#d0a657] bg-[#d0a657]/10 font-bold text-[#f1eee7]"
                      : "border-[#312a1c] text-[#9d98a8] hover:border-[#d0a657]/50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        ),
      )}

      <label className="flex items-start gap-2 text-sm leading-5 text-[#d5cfda]">
        <input type="checkbox" checked={interviewOptIn} onChange={(event) => setInterviewOptIn(event.target.checked)} className="mt-0.5" />
        I&apos;m open to a 15-minute user interview.
      </label>

      {state === "error" ? <p className="text-sm font-semibold text-[#e08aa5]">Could not submit — try again in a moment.</p> : null}

      <Button
        type="button"
        onClick={() => void submit()}
        disabled={!answers.changedPlans || !answers.topFeature || !answers.pricePreference || state === "submitting"}
      >
        {state === "submitting" ? "Sending..." : "Send answers"}
      </Button>
    </Card>
  );
}
