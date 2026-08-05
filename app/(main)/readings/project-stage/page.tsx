"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { CardIcon } from "@/components/cards/card-icon";
import { ProPrompt } from "@/components/validation/pro-prompt";
import { ReadingSynthesis } from "@/components/cards/reading-synthesis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { track, trackReadingCompleted } from "@/lib/analytics/client";
import { CARD_CONTENT_VERSION, getCardContentByName, orientationContent } from "@/lib/card-content";
import { extractSubject } from "@/lib/context-extract";
import { ORIENTATION_LABELS } from "@/lib/domain";
import { guestStore } from "@/lib/guestStore";
import { INTERPRETATION_ENGINE_VERSION, interpretDrawnCard } from "@/lib/interpret";
import { SYNTHESIS_ENGINE_VERSION, synthesizeReading } from "@/lib/synthesis";
import { BUILDER_TYPES, getProjectStage, PROJECT_STAGES, type BuilderType, type ProjectStageKey } from "@/lib/projectStages";
import { getProjectStageSpread } from "@/lib/spreads";
import type { DrawResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type FlowStep = "stage" | "context" | "reading";

type ProjectContext = {
  projectName: string;
  builderType: BuilderType;
  context: string;
};

const stepLabels: Array<{ key: FlowStep; label: string }> = [
  { key: "stage", label: "Stage" },
  { key: "context", label: "Context" },
  { key: "reading", label: "Reading" },
];

export default function ProjectStageReadingPage() {
  const { data: sessionData } = authClient.useSession();
  const [flowStep, setFlowStep] = useState<FlowStep>("stage");
  const [selectedStageKey, setSelectedStageKey] = useState<ProjectStageKey | null>(null);
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    projectName: "",
    builderType: "Developer",
    context: "",
  });
  const [result, setResult] = useState<DrawResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [saveState, setSaveState] = useState<{ status: "idle" | "saving" | "saved" | "error"; entryId?: string }>({
    status: "idle",
  });

  const selectedStage = selectedStageKey ? getProjectStage(selectedStageKey) : null;
  const spread = selectedStageKey ? getProjectStageSpread(selectedStageKey) : null;

  const readingCards = useMemo(() => {
    if (!result || !selectedStageKey || !selectedStage || !spread) return [];

    // Used-frame tracking keeps the three cards from rhyming: no interpretation
    // or action frame repeats within a reading while alternatives exist.
    const usedFrameIds = new Set<string>();
    const usedActionFrameIds = new Set<string>();

    return result.cards.map((item, index) => {
      const position = spread.positions[index];
      const reading = interpretDrawnCard({
        card: item.card,
        orientation: item.orientation,
        role: position.role,
        positionLabel: position.label,
        context: projectContext.context,
        projectName: projectContext.projectName,
        stage: selectedStageKey,
        seed: `${selectedStageKey}:${item.card.id}:${index}:${item.orientation}`,
        usedFrameIds,
        usedActionFrameIds,
      });
      usedFrameIds.add(reading.frameId);
      usedActionFrameIds.add(reading.actionFrameId);

      return { ...item, position, reading };
    });
  }, [projectContext.context, projectContext.projectName, result, selectedStage, selectedStageKey, spread]);

  const synthesis = useMemo(() => {
    if (readingCards.length < 2 || !selectedStageKey) return null;
    const subject = extractSubject({
      context: projectContext.context,
      projectName: projectContext.projectName,
      stage: selectedStageKey,
    });
    const cards = readingCards.map((item) => ({
      cardId: item.card.id,
      name: item.card.name,
      orientation: item.orientation,
      role: item.position.role,
      positionLabel: item.position.label,
      nextAction: item.reading.nextAction,
    }));
    const seed = `${selectedStageKey}:${cards.map((card) => `${card.cardId}:${card.orientation}`).join("|")}`;
    return synthesizeReading({ cards, spreadType: `project-stage:${selectedStageKey}`, subject, seed });
  }, [readingCards, selectedStageKey, projectContext.context, projectContext.projectName]);

  function chooseStage(stageKey: ProjectStageKey) {
    setSelectedStageKey(stageKey);
    setFlowStep("context");
    setError("");
  }

  async function drawReading(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!selectedStageKey || !spread) return;
    if (!projectContext.context.trim()) {
      setError("Add a little project context so the reading has something useful to reflect.");
      return;
    }

    setBusy(true);
    setError("");
    setCopyStatus("");
    setSaveState({ status: "idle" });

    track("project_reading_started", { stage: selectedStageKey, authed: Boolean(sessionData?.user) });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const response = await fetch("/api/draw", {
      method: "POST",
      body: JSON.stringify({
        spreadType: `project-stage:${selectedStageKey}`,
        positions: spread.positions.map((position) => position.label),
        // Unified reversal policy: project readings honor the same
        // user-adjustable default as other draws (30% unless changed).
        reversedChance: guestStore.getSettings().defaultReversedChance,
      }),
    });

    if (!response.ok) {
      setError("The deck did not respond. Try pulling again in a moment.");
      setBusy(false);
      return;
    }

    const drawResult = (await response.json()) as DrawResult;
    setResult(drawResult);
    setFlowStep("reading");
    setBusy(false);

    // Completed = interpretation successfully displayed; failed requests and
    // abandoned setup never reach this line. Once-per-draw dedupe by card ids.
    trackReadingCompleted(
      `project:${drawResult.cards.map((item) => item.card.id).join("-")}`,
      "project_reading_completed",
      {
        surface: "project-stage",
        stage: selectedStageKey,
        authed: Boolean(sessionData?.user),
        reversedCount: drawResult.cards.filter((item) => item.orientation === "REVERSED").length,
      },
    );
  }

  async function saveReading() {
    if (!selectedStageKey || !spread || readingCards.length === 0 || saveState.status === "saving") return;

    setSaveState({ status: "saving" });

    const subject = extractSubject({
      context: projectContext.context,
      projectName: projectContext.projectName,
      stage: selectedStageKey,
    });

    // Snapshot = the exact rendered reading. The raw context paragraph is
    // deliberately NOT included — only the safely extracted subject.
    const snapshotCards = readingCards.map((item) => ({
      cardId: item.card.id,
      positionName: item.position.label,
      orientation: item.orientation,
      interpretationText: item.reading.interpretation,
      nextActionText: item.reading.nextAction || undefined,
      reflectionQuestionText: item.reading.reflectionQuestion || undefined,
      positionRole: item.position.role,
      cardContentVersion: CARD_CONTENT_VERSION,
    }));
    const entrySnapshot = {
      projectStage: selectedStageKey,
      subject,
      synthesisHeadline: synthesis?.synthesis.headline,
      synthesisSummary: synthesis?.synthesis.summary,
      synthesisPriorityAction: synthesis?.synthesis.priorityAction,
      engineVersion: INTERPRETATION_ENGINE_VERSION,
      synthesisVersion: SYNTHESIS_ENGINE_VERSION,
    };

    let entryId: string | undefined;
    if (sessionData?.user) {
      const response = await fetch("/api/journal", {
        method: "POST",
        body: JSON.stringify({
          spreadType: `project-stage:${selectedStageKey}`,
          notes: "",
          cards: snapshotCards,
          ...entrySnapshot,
        }),
      });
      if (!response.ok) {
        setSaveState({ status: "error" });
        return;
      }
      entryId = ((await response.json()) as { id?: string }).id;
    } else {
      entryId = crypto.randomUUID();
      guestStore.saveJournal({
        id: entryId,
        spreadType: `project-stage:${selectedStageKey}`,
        // Persisted for a human-readable journal title; empty stays undefined.
        projectName: projectContext.projectName.trim() || undefined,
        notes: "",
        createdAt: new Date().toISOString(),
        cards: readingCards.map((item) => ({
          cardId: item.card.id,
          cardName: item.card.name,
          positionName: item.position.label,
          orientation: item.orientation,
          interpretationText: item.reading.interpretation,
          nextActionText: item.reading.nextAction || undefined,
          reflectionQuestionText: item.reading.reflectionQuestion || undefined,
        })),
        ...entrySnapshot,
      });
    }

    setSaveState({ status: "saved", entryId });
    track("journal_entry_saved", {
      surface: "project-stage",
      stage: selectedStageKey,
      authed: Boolean(sessionData?.user),
      hasSnapshot: true,
    });
  }

  function startOver() {
    setFlowStep("stage");
    setSelectedStageKey(null);
    setResult(null);
    setError("");
    setCopyStatus("");
    setSaveState({ status: "idle" });
    setProjectContext({ projectName: "", builderType: "Developer", context: "" });
  }

  async function copyReading() {
    if (!selectedStage || !spread || readingCards.length === 0) return;

    const projectLine = projectContext.projectName.trim() ? `Project: ${projectContext.projectName.trim()}\n` : "";
    const text = [
      "Builder's Tarot - Project Stage Reading",
      projectLine.trimEnd(),
      `Stage: ${selectedStage.name}`,
      `Builder type: ${projectContext.builderType}`,
      `Context: ${projectContext.context.trim()}`,
      `Spread: ${spread.name}`,
      "",
      ...(synthesis
        ? [
            "Reading Together",
            synthesis.synthesis.headline,
            synthesis.synthesis.summary,
            ...(synthesis.synthesis.priorityAction ? [`Start here: ${synthesis.synthesis.priorityAction}`] : []),
            "",
          ]
        : []),
      ...readingCards.flatMap((item, index) => [
        `${index + 1}. ${item.position.label} - ${item.card.name} (${ORIENTATION_LABELS[item.orientation]})`,
        `Prompt: ${item.position.prompt}`,
        `Interpretation: ${item.reading.interpretation}`,
        ...(item.reading.nextAction ? [`Next action: ${item.reading.nextAction}`] : []),
        ...(item.reading.reflectionQuestion ? [`Reflection: ${item.reading.reflectionQuestion}`] : []),
        "",
      ]),
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(text);
    setCopyStatus("Copied");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">Project reading</p>
          <h1 className="mt-2 font-display text-4xl font-black text-[#f1eee7]">Project Stage Reading</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9d98a8]">
            Choose where the build really is, pull a focused three-card spread, and turn the reading into one practical next move.
          </p>
        </div>
        <ProgressIndicator currentStep={flowStep} />
      </div>

      {flowStep === "stage" ? (
        <section className="grid gap-3 md:grid-cols-2">
          {PROJECT_STAGES.map((stage, index) => (
            <motion.button
              key={stage.key}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.03 }}
              onClick={() => chooseStage(stage.key)}
              className="gold-focus group rounded-xl border border-[#312a1c] bg-[#11101a]/82 p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.2)] transition-colors hover:border-[#d0a657]/60 hover:bg-[#17151f]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-black text-[#f1eee7]">{stage.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#9d98a8]">{stage.description}</p>
                </div>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3d3322] text-sm font-black text-[#d0a657] transition-colors group-hover:border-[#d0a657]/70">
                  {index + 1}
                </span>
              </div>
            </motion.button>
          ))}
        </section>
      ) : null}

      {flowStep === "context" && selectedStage && spread ? (
        <Card className="space-y-5">
          <div className="flex flex-col gap-3 border-b border-[#312a1c] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge>{selectedStage.name}</Badge>
              <h2 className="mt-3 font-display text-2xl font-black text-[#f1eee7]">{spread.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#9d98a8]">
                {spread.positions.map((position) => position.label).join(" / ")}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => setFlowStep("stage")}>
              Change Stage
            </Button>
          </div>

          <form className="space-y-4" onSubmit={drawReading}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="projectName" className="mb-1 block text-sm font-medium text-[#d5cfda]">
                  Project name
                </label>
                <Input
                  id="projectName"
                  value={projectContext.projectName}
                  onChange={(event) => setProjectContext((current) => ({ ...current, projectName: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="builderType" className="mb-1 block text-sm font-medium text-[#d5cfda]">
                  Builder type
                </label>
                <Select
                  id="builderType"
                  value={projectContext.builderType}
                  onChange={(event) => setProjectContext((current) => ({ ...current, builderType: event.target.value as BuilderType }))}
                >
                  {BUILDER_TYPES.map((builderType) => (
                    <option key={builderType} value={builderType}>
                      {builderType}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="context" className="mb-1 block text-sm font-medium text-[#d5cfda]">
                What are you building, and what do you need clarity on?
              </label>
              <Textarea
                id="context"
                value={projectContext.context}
                onChange={(event) => setProjectContext((current) => ({ ...current, context: event.target.value }))}
                placeholder="Example: I'm building a small habit tracker and I'm not sure what belongs in the first version."
                className="min-h-[150px]"
              />
            </div>

            {error ? <p className="text-sm font-semibold text-[#e08aa5]">{error}</p> : null}

            <Button type="submit" disabled={busy}>
              {busy ? "Shuffling for this stage..." : "Pull Project Spread"}
            </Button>
          </form>
        </Card>
      ) : null}

      {flowStep === "reading" && selectedStage && spread && result ? (
        <section className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge>{spread.name}</Badge>
                <h2 className="mt-3 font-display text-3xl font-black text-[#f1eee7]">
                  {projectContext.projectName.trim() || "Project Reading"}
                </h2>
                <div className="mt-3 grid gap-2 text-sm text-[#9d98a8] md:grid-cols-2">
                  <p>
                    <span className="font-black text-[#d5cfda]">Stage:</span> {selectedStage.name}
                  </p>
                  <p>
                    <span className="font-black text-[#d5cfda]">Builder:</span> {projectContext.builderType}
                  </p>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d5cfda]">{projectContext.context}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={startOver}>
                  Start over
                </Button>
                <Button type="button" variant="secondary" onClick={() => void drawReading()} disabled={busy}>
                  {busy ? "Pulling..." : "Pull again"}
                </Button>
                <Button type="button" onClick={copyReading}>
                  {copyStatus || "Copy reading"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => void saveReading()} disabled={saveState.status === "saving"}>
                  {saveState.status === "saving" ? "Saving..." : saveState.status === "saved" ? "Saved" : "Save to journal"}
                </Button>
              </div>
            </div>
            {saveState.status === "saved" ? (
              <p className="text-sm text-[#9d98a8]">
                Reading saved.{" "}
                <Link href={saveState.entryId ? `/journal/${saveState.entryId}` : "/journal"} className="font-semibold text-[#d0a657] underline">
                  View it in your journal
                </Link>
                .
              </p>
            ) : null}
            {saveState.status === "error" ? (
              <p className="text-sm font-semibold text-[#e08aa5]">Could not save right now. Try again in a moment.</p>
            ) : null}
          </Card>

          {/* The practical next action is the payoff — lead with it, above the
              denser synthesis explanation. */}
          {synthesis?.synthesis.priorityAction ? (
            <StartHere action={synthesis.synthesis.priorityAction} />
          ) : null}

          {synthesis ? (
            <ReadingSynthesis synthesis={synthesis.synthesis} showPriorityAction={false} />
          ) : null}

          {saveState.status === "saved" ? (
            <ProPrompt
              placement="post_save"
              stage={selectedStageKey}
              registers={readingCards.map(
                (item) => {
                  const content = getCardContentByName(item.card.name);
                  return content ? orientationContent(content, item.orientation).register : null;
                },
              ).filter((register): register is NonNullable<typeof register> => register !== null)}
            />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            {readingCards.map((item, index) => (
              <motion.article
                key={`${item.card.id}-${item.position.label}-${index}`}
                initial={{ opacity: 0, y: 18, rotateY: 36 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.42, delay: index * 0.1 }}
              >
                <Card className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{item.position.label}</Badge>
                        <Badge className={item.orientation === "REVERSED" ? "border-[#6d3144] bg-[#1d1018] text-[#e08aa5]" : ""}>
                          {ORIENTATION_LABELS[item.orientation]}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-[#9d98a8]">{item.position.prompt}</p>
                    </div>
                    <span className="text-sm font-black text-[#d0a657]">0{index + 1}</span>
                  </div>

                  <div className="tarot-card-face flex aspect-[2/3] max-h-[330px] flex-col items-center justify-between rounded-[18px] px-6 py-7 text-center">
                    <p className="relative font-display text-[0.66rem] font-black uppercase tracking-[0.36em] text-[#8e6d32]">
                      project
                    </p>
                    <CardIcon cardName={item.card.name} className="relative h-14 w-14" strokeWidth={3} />
                    <div className="relative">
                      <h3 className="font-display text-2xl font-black text-[#d0a657]">{item.card.name}</h3>
                      <p className="mt-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#9d98a8]">{item.position.label}</p>
                    </div>
                  </div>

                  <ReadingBlock title="Interpretation" body={item.reading.interpretation} />
                  {item.reading.nextAction ? (
                    item.reading.nextAction === synthesis?.synthesis.priorityAction ? (
                      // Already promoted to the "Start here" hero — reference it
                      // instead of repeating the same action verbatim.
                      <p className="flex items-center gap-1.5 rounded-lg border border-[#d0a657]/40 bg-[#1b1710] px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#d0a657]">
                        <Compass className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />
                        Your Start-here move
                      </p>
                    ) : (
                      <ReadingBlock title="Next action" body={item.reading.nextAction} />
                    )
                  ) : null}
                  {item.reading.reflectionQuestion ? (
                    <ReadingBlock title="Reflect" body={item.reading.reflectionQuestion} />
                  ) : null}
                </Card>
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProgressIndicator({ currentStep }: { currentStep: FlowStep }) {
  const activeIndex = stepLabels.findIndex((step) => step.key === currentStep);

  return (
    <div className="flex min-w-fit items-center gap-2 rounded-xl border border-[#312a1c] bg-[#11101a]/80 p-2">
      {stepLabels.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 items-center rounded-lg px-3 text-xs font-black uppercase tracking-[0.16em] transition-colors",
              index <= activeIndex ? "bg-[#d0a657] text-[#090810]" : "bg-[#17151f] text-[#827c8e]",
            )}
          >
            {step.label}
          </span>
          {index < stepLabels.length - 1 ? <span className="h-px w-4 bg-[#3d3322]" /> : null}
        </div>
      ))}
    </div>
  );
}

// The single priority action is emphasized once, in the "Start here" hero.
// Individual card blocks share one calm, scannable treatment so nothing
// competes with it.
function StartHere({ action }: { action: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="start-here-heading"
      className="rounded-xl border-2 border-[#d0a657]/70 bg-[#1b1710] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d0a657] text-[#090810]">
          <Compass className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#d0a657]">Your next move</p>
      </div>
      <h2 id="start-here-heading" className="mt-3 font-display text-2xl font-black text-[#f1eee7]">
        Start here
      </h2>
      <p className="mt-2 text-base leading-7 text-[#f1eee7]">{action}</p>
    </motion.section>
  );
}

function ReadingBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[#312a1c] bg-[#0b0a12]/62 p-3">
      <h4 className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#d0a657]">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-[#d5cfda]">{body}</p>
    </div>
  );
}
