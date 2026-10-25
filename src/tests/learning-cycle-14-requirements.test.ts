import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChallengeEvaluator } from "@/features/challenges/challenge-evaluator";
import { ProgressStore } from "@/lib/storage/progress-store";
import { getLessonById, getNextLesson, getPreviousLesson } from "@/data/curriculum";
import { PosixSandboxAdapter } from "@/features/linux-runtime/posix-sandbox-adapter";

describe("Core Learning Cycle: 14 Critical Verification Requirements", () => {
  let runtime: PosixSandboxAdapter;
  let confettiTriggerCount = 0;
  const mockConfetti = vi.fn(() => {
    confettiTriggerCount++;
  });

  beforeEach(async () => {
    ProgressStore.reset();
    confettiTriggerCount = 0;
    mockConfetti.mockClear();

    runtime = new PosixSandboxAdapter();
    await runtime.initialize();
  });

  // Requirement 1: Running a command does not automatically complete a challenge
  it("Requirement 1: Running a command does not automatically complete a challenge", async () => {
    const lesson = getLessonById("w1d1_01_pwd")!;
    // User executes 'echo hello'
    const execRes = await runtime.executeCommand("echo hello");
    expect(execRes.exitCode).toBe(0);

    const fsState = await runtime.getFilesystemState();
    const evaluation = ChallengeEvaluator.evaluate(lesson, execRes, fsState, "echo hello");

    expect(evaluation.passed).toBe(false);
    expect(ProgressStore.load().completedLessons).not.toContain(lesson.id);
  });

  // Requirement 2: An incorrect command does not complete a challenge
  it("Requirement 2: An incorrect command does not complete a challenge", async () => {
    const lesson = getLessonById("w1d1_01_pwd")!;
    const execRes = await runtime.executeCommand("pwd");
    // Simulate invalid stdout
    const fsState = await runtime.getFilesystemState();
    const evaluation = ChallengeEvaluator.evaluate(
      lesson,
      { ...execRes, stdout: "wrong_output" },
      fsState,
      "pwd"
    );

    expect(evaluation.passed).toBe(false);
    expect(evaluation.detected).toBe("wrong_output");
  });

  // Requirement 3: A correct task outcome passes the appropriate validator
  it("Requirement 3: A correct task outcome passes the appropriate validator", async () => {
    const lesson = getLessonById("w1d1_01_pwd")!;
    const execRes = await runtime.executeCommand("pwd");
    const fsState = await runtime.getFilesystemState();
    const evaluation = ChallengeEvaluator.evaluate(lesson, execRes, fsState, "pwd");

    expect(evaluation.passed).toBe(true);
    expect(evaluation.message).toContain("Great job");
  });

  // Requirement 4: Equivalent commands are accepted when the task evaluates resulting state rather than syntax
  it("Requirement 4: Equivalent commands are accepted for filesystem state tasks", async () => {
    const touchLesson = getLessonById("w1d2_08_touch")!; // requires file hello.txt
    // Equivalent solution: using echo redirect instead of touch to create hello.txt
    await runtime.executeCommand("echo '' > hello.txt");
    const fsState = await runtime.getFilesystemState();

    const evaluation = ChallengeEvaluator.evaluate(
      touchLesson,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      fsState,
      "echo '' > hello.txt"
    );

    expect(evaluation.passed).toBe(true);
  });

  // Requirement 5: Required techniques are enforced when explicitly configured
  it("Requirement 5: Required techniques are enforced when explicitly configured", async () => {
    const lesson = getLessonById("w1d1_01_pwd")!;
    // Clone lesson with requiredTechnique set
    const strictLesson = {
      ...lesson,
      challenge: {
        ...lesson.challenge,
        requiredTechnique: "-P",
      },
    };

    const fsState = await runtime.getFilesystemState();

    // Invoking without required technique fails
    const failEval = ChallengeEvaluator.evaluate(
      strictLesson,
      { stdout: "/home/learner", stderr: "", exitCode: 0, durationMs: 5 },
      fsState,
      "pwd"
    );
    expect(failEval.passed).toBe(false);
    expect(failEval.message).toContain("specifically requires using technique or flag '-P'");

    // Invoking with required technique succeeds
    const passEval = ChallengeEvaluator.evaluate(
      strictLesson,
      { stdout: "/home/learner", stderr: "", exitCode: 0, durationMs: 5 },
      fsState,
      "pwd -P"
    );
    expect(passEval.passed).toBe(true);
  });

  // Requirement 6: Failed validation does not increase progress
  it("Requirement 6: Failed validation does not increase progress", async () => {
    const initialProgress = ProgressStore.load();
    const initialCount = initialProgress.completedLessons.length;

    // Record failed attempt
    ProgressStore.recordAttempt("w1d1_01_pwd", "failed");

    const afterProgress = ProgressStore.load();
    expect(afterProgress.completedLessons.length).toBe(initialCount);
    expect(afterProgress.challengeAttempts["w1d1_01_pwd"].attempts).toBe(1);
    expect(afterProgress.challengeAttempts["w1d1_01_pwd"].lastStatus).toBe("failed");
  });

  // Requirement 7: Successful validation updates progress exactly once
  it("Requirement 7: Successful validation updates progress exactly once", async () => {
    const initialCount = ProgressStore.load().completedLessons.length;
    const outcome = ProgressStore.completeLesson("w1d1_01_pwd");

    expect(outcome.newlyCompleted).toBe(true);
    expect(outcome.progress.completedLessons.length).toBe(initialCount + 1);
    expect(outcome.progress.completedLessons).toContain("w1d1_01_pwd");
  });

  // Requirement 8: Duplicate validation does not duplicate completion
  it("Requirement 8: Duplicate validation does not duplicate completion", async () => {
    ProgressStore.completeLesson("w1d1_01_pwd");
    const countAfterFirst = ProgressStore.load().completedLessons.length;

    const secondOutcome = ProgressStore.completeLesson("w1d1_01_pwd");
    expect(secondOutcome.newlyCompleted).toBe(false);

    const countAfterSecond = ProgressStore.load().completedLessons.length;
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  // Requirement 9: Refresh restores saved learning progress
  it("Requirement 9: Refresh restores saved learning progress", async () => {
    ProgressStore.completeLesson("w1d1_01_pwd");
    ProgressStore.completeLesson("w1d1_02_ls");

    // Simulating page refresh by reading fresh from storage
    const restored = ProgressStore.load();
    expect(restored.completedLessons).toEqual(["w1d1_01_pwd", "w1d1_02_ls"]);
    expect(restored.currentLessonId).toBe("w1d1_02_ls");
  });

  // Requirement 10: Malformed LocalStorage data does not crash the application
  it("Requirement 10: Malformed LocalStorage data does not crash the application", async () => {
    ProgressStore.setRawItem("terminal-zero:progress:v1", "INVALID_JSON_%%%");
    expect(() => ProgressStore.load()).not.toThrow();

    const safeData = ProgressStore.load();
    expect(safeData).toBeDefined();
    expect(safeData.schemaVersion).toBe(1);
  });

  // Requirement 11: Existing progress is not overwritten during initialization
  it("Requirement 11: Existing progress is not overwritten during initialization", async () => {
    ProgressStore.completeLesson("w1d1_01_pwd");

    // Calling load repeatedly does not overwrite valid stored keys
    const read1 = ProgressStore.load();
    const read2 = ProgressStore.load();
    expect(read1.completedLessons).toContain("w1d1_01_pwd");
    expect(read2.completedLessons).toContain("w1d1_01_pwd");
  });

  // Requirement 12: Completed challenges do not trigger confetti again after refresh
  it("Requirement 12: Completed challenges do not trigger confetti again after refresh", async () => {
    // 1. Initial complete
    const firstOutcome = ProgressStore.completeLesson("w1d1_01_pwd");
    if (firstOutcome.newlyCompleted) mockConfetti();
    expect(confettiTriggerCount).toBe(1);

    // 2. Refresh occurs
    ProgressStore.load();

    // 3. User re-runs command on completed challenge
    const secondOutcome = ProgressStore.completeLesson("w1d1_01_pwd");
    if (secondOutcome.newlyCompleted) mockConfetti();

    // Confetti did NOT trigger a second time!
    expect(confettiTriggerCount).toBe(1);
  });

  // Requirement 13: Terminal execution errors and validation failures remain distinguishable
  it("Requirement 13: Terminal execution errors and validation failures remain distinguishable", async () => {
    const lesson = getLessonById("w1d1_01_pwd")!;
    const fsState = await runtime.getFilesystemState();

    // Case A: Linux Execution error (syntax/bash error)
    const execFailure = await runtime.executeCommand("invalid_cmd_xyz");
    expect(execFailure.exitCode).toBe(127);
    const evalExecFail = ChallengeEvaluator.evaluate(lesson, execFailure, fsState, "invalid_cmd_xyz");
    expect(evalExecFail.passed).toBe(false);
    expect(evalExecFail.message).toContain("Command execution failed");
    expect(evalExecFail.detected).toContain("127");

    // Case B: Execution succeeded in Linux, but challenge validation failed
    const execSuccess = await runtime.executeCommand("ls");
    expect(execSuccess.exitCode).toBe(0);
    const evalValidFail = ChallengeEvaluator.evaluate(lesson, execSuccess, fsState, "ls");
    expect(evalValidFail.passed).toBe(false);
    expect(evalValidFail.message).toContain("pwd");
  });

  // Requirement 14: Existing lesson navigation continues to work
  it("Requirement 14: Existing lesson navigation continues to work", async () => {
    const current = getLessonById("w1d1_01_pwd")!;
    const next = getNextLesson(current.id);
    const prev = getPreviousLesson(current.id);

    expect(prev).toBeUndefined();
    expect(next).toBeDefined();
    expect(next?.id).toBe("w1d1_02_ls");
    expect(next?.sequence).toBe(2);

    const prevOfNext = getPreviousLesson(next!.id);
    expect(prevOfNext?.id).toBe("w1d1_01_pwd");
  });
});
