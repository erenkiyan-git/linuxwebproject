"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  getLessonById,
  getNextLesson,
  getPreviousLesson,
  ALL_LESSONS,
} from "@/data/curriculum";
import { useLearnerProgress } from "@/lib/storage/progress-store";
import { TerminalWorkspace } from "@/components/terminal/TerminalWorkspace";
import { ChallengeEvaluator } from "@/features/challenges/challenge-evaluator";
import { runtimeManager } from "@/features/linux-runtime/runtime-manager";
import { RuntimeExecutionResult } from "@/types/runtime";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Copy,
  Terminal,
  BookOpen,
  Award,
  Sparkles,
  HelpCircle,
  Flame,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Compass,
} from "lucide-react";

import {
  ExecutionStatus,
  ValidationStatus,
  ChallengeStatus,
  LearningStage,
  ValidationResult,
} from "@/types/curriculum";

interface LessonWorkspaceViewProps {
  lessonId: string;
}

export function LessonWorkspaceView({ lessonId }: LessonWorkspaceViewProps) {
  const lesson = getLessonById(lessonId);
  const nextLesson = getNextLesson(lessonId);
  const prevLesson = getPreviousLesson(lessonId);

  const { progress, markComplete, recordAttempt } = useLearnerProgress();

  const [activeMobileTab, setActiveMobileTab] = useState<"lesson" | "terminal">("lesson");
  const [activeStage, setActiveStage] = useState<LearningStage>("learn");
  const [hintIndex, setHintIndex] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>("idle");
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("not_started");
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus>("available");
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [copiedText, setCopiedText] = useState("");

  const isCompleted =
    progress.completedLessons.includes(lessonId) ||
    progress.completedLessonIds.includes(lessonId);

  const attemptData = progress.challengeAttempts?.[lessonId];
  const attemptCount = attemptData?.attempts || 0;

  // Sync challenge status on navigation or stored progress hydration
  useEffect(() => {
    if (isCompleted) {
      setChallengeStatus("completed");
      setValidationStatus("passed");
      setActiveStage("progress");
      setLastValidation({
        passed: true,
        message: lesson?.challenge.successMessage || "Challenge already completed!",
      });
    } else {
      setChallengeStatus("available");
      setValidationStatus("not_started");
      setActiveStage("learn");
      setLastValidation(null);
      setShowSolution(false);
      setShowHints(false);
      setHintIndex(0);
    }
  }, [lessonId, isCompleted, lesson]);

  if (!lesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#090B10]">
        <h2 className="text-xl font-bold text-[#FB7185]">Lesson Not Found</h2>
        <p className="text-sm text-[#A0A8B8] mt-2">
          The requested lesson ID &apos;{lessonId}&apos; does not exist in the curriculum.
        </p>
        <Link
          href="/learn"
          className="mt-4 px-4 py-2 bg-[#171B24] border border-[#272D39] rounded text-sm text-[#F4F6FA] hover:bg-[#272D39] transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Handle command executed in the terminal
  const handleCommandExecuted = async (cmd: string, result: RuntimeExecutionResult) => {
    const execStatus: ExecutionStatus = result.exitCode === 0 ? "succeeded" : "failed";
    setExecutionStatus(execStatus);
    setValidationStatus("checking");

    const adapter = runtimeManager.getActiveAdapter();
    const fsState = await adapter.getFilesystemState();

    // Check file contents if required
    const fileContents: Record<string, string> = {};
    if (lesson.challenge.fileContentsCheck) {
      for (const f of Object.keys(lesson.challenge.fileContentsCheck)) {
        const content = await adapter.readFile(f);
        if (content !== null) {
          fileContents[f] = content;
        }
      }
    }

    const evaluation = ChallengeEvaluator.evaluate(lesson, result, fsState, cmd, fileContents);
    setLastValidation(evaluation);

    // Record attempt persistently in LocalStorage
    recordAttempt(lesson.id, evaluation.passed ? "passed" : "failed");

    if (evaluation.passed) {
      setValidationStatus("passed");
      setChallengeStatus("completed");
      setActiveStage("progress");

      // Verify that this is a confirmed transition from incomplete to completed
      const outcome = markComplete(lesson.id);

      // Confetti triggers ONLY on a genuine new completion transition
      if (outcome.newlyCompleted && !progress.settings.reducedMotion) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#8B7CFF", "#36D399", "#F6C66A"],
        });
      }
    } else {
      setValidationStatus("failed");
      setActiveStage("validate");
      if (!isCompleted) {
        setChallengeStatus("available");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Switch to practice stage and optionally open terminal on mobile
  const handleStartPractice = () => {
    setActiveStage("practice");
    if (window.innerWidth < 768) {
      setActiveMobileTab("terminal");
    }
  };

  const solutionCommand = lesson.challenge.solution || lesson.examples[0] || lesson.commandName;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-hidden bg-[#090B10]">
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#11141B] border-b border-[#272D39] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="flex items-center gap-1.5 text-xs text-[#A0A8B8] hover:text-[#F4F6FA] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Learn</span>
          </Link>

          <div className="h-3.5 w-[1px] bg-[#272D39]" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#A0A8B8]">Week {lesson.week}</span>
            <span className="text-[#272D39]">/</span>
            <span className="text-[#A0A8B8]">Day {lesson.day}</span>
            <span className="text-[#272D39]">/</span>
            <span className="text-[#F4F6FA] font-medium font-mono">
              #{lesson.sequence} {lesson.commandName}
            </span>
          </div>
        </div>

        {/* Mobile View Switcher (Lesson vs Terminal) */}
        <div className="flex md:hidden items-center bg-[#171B24] border border-[#272D39] rounded p-0.5 text-xs">
          <button
            onClick={() => setActiveMobileTab("lesson")}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
              activeMobileTab === "lesson"
                ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                : "text-[#A0A8B8]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("terminal")}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
              activeMobileTab === "terminal"
                ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                : "text-[#A0A8B8]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>
        </div>

        {/* Next / Previous Lesson Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {prevLesson && (
            <Link
              href={`/lesson/${prevLesson.id}`}
              className="p-1.5 text-[#A0A8B8] hover:text-[#F4F6FA] hover:bg-[#171B24] rounded border border-[#272D39] transition-colors"
              title={`Previous: ${prevLesson.title}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          )}

          {nextLesson && (
            <Link
              href={`/lesson/${nextLesson.id}`}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                isCompleted
                  ? "bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] font-semibold border-transparent"
                  : "bg-[#171B24] text-[#A0A8B8] hover:text-[#F4F6FA] border-[#272D39]"
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT COLUMN: 4-STAGE LEARNING GUIDE */}
        <div
          className={`w-full md:w-[45%] lg:w-[42%] flex flex-col h-full border-r border-[#272D39] bg-[#0B0D12] overflow-hidden ${
            activeMobileTab === "terminal" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* STAGE STEPPER BAR: LEARN -> PRACTICE -> VALIDATE -> PROGRESS */}
          <div className="flex items-center border-b border-[#272D39] bg-[#11141B] px-3 py-2 text-xs overflow-x-auto shrink-0 select-none">
            <button
              onClick={() => setActiveStage("learn")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeStage === "learn"
                  ? "bg-[#8B7CFF]/15 text-[#8B7CFF] font-semibold border border-[#8B7CFF]/40"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Learn</span>
            </button>

            <span className="text-[#272D39] mx-1">›</span>

            <button
              onClick={() => setActiveStage("practice")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeStage === "practice"
                  ? "bg-[#8B7CFF]/15 text-[#8B7CFF] font-semibold border border-[#8B7CFF]/40"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>2. Practice</span>
            </button>

            <span className="text-[#272D39] mx-1">›</span>

            <button
              onClick={() => setActiveStage("validate")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeStage === "validate"
                  ? validationStatus === "failed"
                    ? "bg-[#FB7185]/15 text-[#FB7185] font-semibold border border-[#FB7185]/40"
                    : "bg-[#8B7CFF]/15 text-[#8B7CFF] font-semibold border border-[#8B7CFF]/40"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              {validationStatus === "failed" ? (
                <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
              <span>3. Validate</span>
              {attemptCount > 0 && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#171B24] border border-[#272D39] text-[#A0A8B8]">
                  #{attemptCount}
                </span>
              )}
            </button>

            <span className="text-[#272D39] mx-1">›</span>

            <button
              onClick={() => setActiveStage("progress")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                activeStage === "progress"
                  ? "bg-[#36D399]/15 text-[#36D399] font-semibold border border-[#36D399]/40"
                  : isCompleted
                  ? "text-[#36D399] hover:underline"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#36D399]" />
              ) : (
                <Award className="w-3.5 h-3.5" />
              )}
              <span>4. Progress</span>
            </button>
          </div>

          {/* STAGE CONTENT CONTAINER */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-[#8B7CFF]/10 text-[#8B7CFF] text-[11px] font-mono rounded border border-[#8B7CFF]/30">
                  {lesson.category}
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-[11px] text-[#36D399] font-medium bg-[#36D399]/10 px-2 py-0.5 rounded border border-[#36D399]/30">
                    <CheckCircle2 className="w-3 h-3" /> Solved
                  </span>
                )}
                <span className="text-[11px] text-[#A0A8B8] font-mono">
                  {lesson.estimatedMinutes} min
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F4F6FA]">
                {lesson.title}
              </h1>
              <p className="text-xs text-[#A0A8B8] mt-1 font-mono">
                Command: <span className="text-[#8B7CFF] font-semibold">{lesson.commandName}</span>
              </p>
            </div>

            {/* STAGE A: LEARN VIEW */}
            {activeStage === "learn" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Learning Objective Card */}
                <div className="p-3.5 rounded-lg bg-[#11141B] border border-[#272D39]">
                  <div className="text-xs font-semibold text-[#8B7CFF] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Learning Objective</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#F4F6FA] leading-relaxed">
                    {lesson.learningObjective}
                  </p>
                </div>

                {/* Plain-Language Explanation */}
                <div>
                  <h2 className="text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-2">
                    Concept Explanation
                  </h2>
                  <p className="text-xs sm:text-sm text-[#A0A8B8] leading-relaxed">
                    {lesson.explanation}
                  </p>
                </div>

                {/* Why It Matters */}
                <div className="p-3.5 rounded-lg bg-[#171B24] border border-[#272D39] text-xs">
                  <div className="font-semibold text-[#F6C66A] flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Why This Matters in Real Linux</span>
                  </div>
                  <p className="text-[#A0A8B8] leading-relaxed">
                    {lesson.challenge.whyItMatters ||
                      `Mastering '${lesson.commandName}' is fundamental for inspecting system state, managing files, and automating developer workflows without GUI overhead.`}
                  </p>
                </div>

                {/* Syntax Box */}
                <div>
                  <h2 className="text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-2">
                    Command Syntax
                  </h2>
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#090B10] border border-[#272D39] font-mono text-xs text-[#8B7CFF]">
                    <code>{lesson.syntax}</code>
                    <button
                      onClick={() => copyToClipboard(lesson.syntax)}
                      className="text-[#A0A8B8] hover:text-[#F4F6FA] transition-colors p-1"
                      title="Copy syntax"
                    >
                      {copiedText === lesson.syntax ? (
                        <Check className="w-3.5 h-3.5 text-[#36D399]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Practical Examples */}
                {lesson.examples.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-2">
                      Practical Examples
                    </h2>
                    <div className="space-y-1.5">
                      {lesson.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 rounded bg-[#11141B] border border-[#272D39] font-mono text-xs text-[#F4F6FA]"
                        >
                          <span>$ {ex}</span>
                          <button
                            onClick={() => copyToClipboard(ex)}
                            className="text-[#A0A8B8] hover:text-[#8B7CFF] transition-colors ml-2 p-0.5"
                            title="Copy example"
                          >
                            {copiedText === ex ? (
                              <Check className="w-3 h-3 text-[#36D399]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Beginner Mistakes */}
                <div className="p-3.5 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs">
                  <div className="font-semibold text-[#FB7185] flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Common Pitfalls</span>
                  </div>
                  <ul className="list-disc list-inside text-[#A0A8B8] space-y-1">
                    {(lesson.challenge.commonMistakes && lesson.challenge.commonMistakes.length > 0)
                      ? lesson.challenge.commonMistakes.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))
                      : [
                          `Typos in command names or missing space between command and options.`,
                          `Confusing relative paths with absolute paths from root (/).`,
                          `Running commands in the wrong directory without checking 'pwd'.`,
                        ].map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                </div>

                {/* CTA: START PRACTICE */}
                <div className="pt-2">
                  <button
                    onClick={handleStartPractice}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    <span>Start Practice in Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE B: PRACTICE VIEW */}
            {activeStage === "practice" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Challenge Objective Card */}
                <div className="p-4 rounded-xl bg-[#171B24] border border-[#8B7CFF]/50 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#F4F6FA] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#8B7CFF]" />
                      <span>Practice Objective</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#8B7CFF]">
                      Strategy: {lesson.challenge.validationStrategy}
                    </span>
                  </div>

                  <p className="text-sm text-[#F4F6FA] font-medium leading-relaxed">
                    {lesson.challenge.instruction}
                  </p>

                  <div className="mt-3 p-2.5 rounded bg-[#090B10] border border-[#272D39] text-xs text-[#A0A8B8]">
                    <span className="text-[#8B7CFF] font-semibold">Expected Behavior: </span>
                    <span>{lesson.challenge.expectedBehavior}</span>
                  </div>
                </div>

                {/* Terminal Guidance Card */}
                <div className="p-3.5 rounded-lg bg-[#11141B] border border-[#272D39] text-xs space-y-2">
                  <div className="font-semibold text-[#F4F6FA] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#36D399]" />
                    <span>How to Complete</span>
                  </div>
                  <p className="text-[#A0A8B8] leading-relaxed">
                    Type and execute your command inside the interactive terminal on the right.
                    You may also use the <strong>Run</strong> button in the terminal toolbar to test the suggested syntax.
                  </p>
                </div>

                {/* Progressive Hints Accordion */}
                <div className="p-3.5 rounded-lg bg-[#11141B] border border-[#272D39] text-xs">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="w-full flex items-center justify-between text-[#F6C66A] font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{showHints ? "Hide Guidance Hints" : "Need a Hint?"}</span>
                    </span>
                    <span className="text-[11px] text-[#A0A8B8]">
                      ({lesson.challenge.hints.length} available)
                    </span>
                  </button>

                  {showHints && (
                    <div className="mt-3 pt-3 border-t border-[#272D39] space-y-2">
                      <p className="text-[#F4F6FA] bg-[#090B10] p-2.5 rounded border border-[#272D39]">
                        {lesson.challenge.hints[hintIndex]}
                      </p>
                      {lesson.challenge.hints.length > 1 && (
                        <button
                          onClick={() =>
                            setHintIndex((prev) => (prev + 1) % lesson.challenge.hints.length)
                          }
                          className="text-[11px] text-[#8B7CFF] hover:underline block"
                        >
                          Show next hint ({hintIndex + 1}/{lesson.challenge.hints.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Reveal Solution */}
                <div className="p-3.5 rounded-lg bg-[#11141B] border border-[#272D39] text-xs">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="w-full flex items-center justify-between text-[#A0A8B8] hover:text-[#F4F6FA] font-medium"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#8B7CFF]" />
                      <span>{showSolution ? "Hide Solution" : "Stuck? Reveal Solution"}</span>
                    </span>
                    <span className="text-[11px] text-[#8B7CFF] underline">
                      {showSolution ? "Hide" : "Reveal"}
                    </span>
                  </button>

                  {showSolution && (
                    <div className="mt-3 pt-3 border-t border-[#272D39] space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-[#090B10] border border-[#272D39] font-mono text-[#36D399]">
                        <code>$ {solutionCommand}</code>
                        <button
                          onClick={() => copyToClipboard(solutionCommand)}
                          className="text-[#A0A8B8] hover:text-[#F4F6FA] p-1"
                          title="Copy solution"
                        >
                          {copiedText === solutionCommand ? (
                            <Check className="w-3.5 h-3.5 text-[#36D399]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#A0A8B8]">
                        {lesson.challenge.solutionExplanation ||
                          `Executing '${solutionCommand}' fulfills the learning objective and modifies the system state accordingly.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE C: VALIDATE VIEW */}
            {activeStage === "validate" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-lg bg-[#11141B] border border-[#272D39]">
                  <div className="text-xs font-semibold text-[#8B7CFF] uppercase tracking-wider mb-1">
                    Validation Status
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {validationStatus === "checking" && (
                      <span className="text-xs text-[#F6C66A] flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#F6C66A] animate-ping" />
                        <span>Evaluating execution results...</span>
                      </span>
                    )}
                    {validationStatus === "passed" && (
                      <span className="text-xs text-[#36D399] flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Validation Passed! Challenge solved.</span>
                      </span>
                    )}
                    {validationStatus === "failed" && (
                      <span className="text-xs text-[#FB7185] flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>Validation Not Satisfied (Attempt #{attemptCount})</span>
                      </span>
                    )}
                    {validationStatus === "not_started" && (
                      <span className="text-xs text-[#A0A8B8]">
                        Awaiting your command execution in the terminal...
                      </span>
                    )}
                  </div>
                </div>

                {/* Structured Failure Report */}
                {validationStatus === "failed" && lastValidation && (
                  <div className="p-4 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 space-y-3">
                    <div className="text-xs font-bold text-[#FB7185] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{lastValidation.message}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {lastValidation.expected && (
                        <div className="p-2.5 rounded bg-[#090B10]/80 border border-[#272D39]">
                          <span className="text-[#8B7CFF] font-semibold block mb-0.5">Expected:</span>
                          <span className="text-[#F4F6FA] font-mono">{lastValidation.expected}</span>
                        </div>
                      )}

                      {lastValidation.detected && (
                        <div className="p-2.5 rounded bg-[#090B10]/80 border border-[#272D39]">
                          <span className="text-[#F6C66A] font-semibold block mb-0.5">Detected:</span>
                          <span className="text-[#F4F6FA] font-mono">{lastValidation.detected}</span>
                        </div>
                      )}

                      {lastValidation.tip && (
                        <div className="p-2.5 rounded bg-[#171B24] border border-[#272D39]">
                          <span className="text-[#36D399] font-semibold block mb-0.5">Actionable Tip:</span>
                          <span className="text-[#A0A8B8]">{lastValidation.tip}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActiveStage("practice");
                        if (window.innerWidth < 768) setActiveMobileTab("terminal");
                      }}
                      className="w-full mt-2 py-2 px-3 bg-[#171B24] hover:bg-[#272D39] text-[#F4F6FA] text-xs font-semibold rounded border border-[#272D39] transition-colors"
                    >
                      Return to Terminal & Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STAGE D: PROGRESS VIEW */}
            {activeStage === "progress" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Solved Card */}
                <div className="p-5 rounded-xl bg-[#36D399]/10 border border-[#36D399]/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#36D399]/20 flex items-center justify-center mx-auto text-[#36D399]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#F4F6FA]">Challenge Solved!</h2>
                    <p className="text-xs text-[#36D399] mt-1 font-medium">
                      {lesson.challenge.successMessage}
                    </p>
                  </div>
                </div>

                {/* Progress Analytics Summary */}
                <div className="p-4 rounded-xl bg-[#11141B] border border-[#272D39] text-xs space-y-3">
                  <div className="font-semibold text-[#8B7CFF] uppercase tracking-wider">
                    Curriculum Progression
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded bg-[#171B24] border border-[#272D39]">
                      <div className="text-[11px] text-[#A0A8B8]">Mastered Commands</div>
                      <div className="text-base font-bold text-[#F4F6FA] mt-0.5">
                        {progress.completedLessons.length} / {ALL_LESSONS.length}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#171B24] border border-[#272D39]">
                      <div className="text-[11px] text-[#A0A8B8]">Daily Streak</div>
                      <div className="text-base font-bold text-[#F6C66A] flex items-center gap-1 mt-0.5">
                        <Flame className="w-4 h-4 fill-current" />
                        <span>{progress.streak} days</span>
                      </div>
                    </div>
                  </div>

                  {attemptCount > 0 && (
                    <div className="text-[11px] text-[#A0A8B8] pt-1">
                      Solved after {attemptCount} practice {attemptCount === 1 ? "attempt" : "attempts"}.
                    </div>
                  )}
                </div>

                {/* Next Lesson CTA */}
                {nextLesson ? (
                  <Link
                    href={`/lesson/${nextLesson.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    <span>Continue to #{nextLesson.sequence} {nextLesson.commandName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/learn"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#36D399] hover:bg-[#6EE7B7] text-[#0B0D12] text-sm font-bold rounded-lg transition-all"
                  >
                    <span>Return to Dashboard</span>
                    <Award className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-[#272D39] flex items-center justify-between">
              {prevLesson ? (
                <Link
                  href={`/lesson/${prevLesson.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#A0A8B8] hover:text-[#F4F6FA] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>#{prevLesson.sequence} {prevLesson.commandName}</span>
                </Link>
              ) : <div />}

              {nextLesson && (
                <Link
                  href={`/lesson/${nextLesson.id}`}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded transition-all ${
                    isCompleted
                      ? "bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12]"
                      : "bg-[#171B24] hover:bg-[#272D39] text-[#F4F6FA] border border-[#272D39]"
                  }`}
                >
                  <span>Next Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL IN-BROWSER LINUX TERMINAL */}
        <div
          className={`flex-1 h-full p-2 sm:p-4 bg-[#0B0D12] overflow-hidden ${
            activeMobileTab === "lesson" ? "hidden md:flex" : "flex"
          }`}
        >
          <TerminalWorkspace
            recommendedCommand={lesson.examples[0] || lesson.commandName}
            onCommandExecuted={handleCommandExecuted}
          />
        </div>
      </div>
    </div>
  );
}
