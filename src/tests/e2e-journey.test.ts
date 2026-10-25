import { describe, it, expect, vi, beforeEach } from "vitest";
import { PosixSandboxAdapter } from "@/features/linux-runtime/posix-sandbox-adapter";
import { ChallengeEvaluator } from "@/features/challenges/challenge-evaluator";
import { ProgressStore } from "@/lib/storage/progress-store";
import { getLessonById, getNextLesson } from "@/data/curriculum";

describe("End-to-End Learner Journey (Test Group D: Runtime & Progression Integration)", () => {
  let runtime: PosixSandboxAdapter;
  let confettiTriggerCount = 0;
  const triggerConfetti = vi.fn(() => {
    confettiTriggerCount++;
  });

  beforeEach(async () => {
    ProgressStore.reset();
    confettiTriggerCount = 0;
    triggerConfetti.mockClear();

    runtime = new PosixSandboxAdapter();
    await runtime.initialize();
  });

  it("completes full learner journey with genuine Linux runtime execution and persistence", async () => {
    // 1. Start lesson 1: w1d1_01_pwd
    const lesson1 = getLessonById("w1d1_01_pwd")!;
    expect(lesson1).toBeDefined();

    // Verify initial state: incomplete, no confetti
    expect(ProgressStore.load().completedLessons).not.toContain("w1d1_01_pwd");
    expect(confettiTriggerCount).toBe(0);

    // 2. Step 4: Run an incorrect command: 'invalid_command_123'
    const invalidResult = await runtime.executeCommand("invalid_command_123");
    expect(invalidResult.exitCode).not.toBe(0);

    const invalidFsState = await runtime.getFilesystemState();
    const evalInvalid = ChallengeEvaluator.evaluate(
      lesson1,
      invalidResult,
      invalidFsState,
      "invalid_command_123"
    );

    // 5 & 6. Confirm challenge remains incomplete and NO confetti
    expect(evalInvalid.passed).toBe(false);
    expect(confettiTriggerCount).toBe(0);
    expect(ProgressStore.load().completedLessons).not.toContain("w1d1_01_pwd");

    // Step 4b: Run a successful but irrelevant command: 'ls'
    const irrelevantResult = await runtime.executeCommand("ls");
    expect(irrelevantResult.exitCode).toBe(0);
    const irrelevantFs = await runtime.getFilesystemState();
    const evalIrrelevant = ChallengeEvaluator.evaluate(
      lesson1,
      irrelevantResult,
      irrelevantFs,
      "ls"
    );

    // Challenge still remains incomplete and NO confetti
    expect(evalIrrelevant.passed).toBe(false);
    expect(confettiTriggerCount).toBe(0);
    expect(ProgressStore.load().completedLessons).not.toContain("w1d1_01_pwd");

    // 7. Step 7: Run the correct solution: 'pwd'
    const correctResult = await runtime.executeCommand("pwd");
    expect(correctResult.exitCode).toBe(0);
    expect(correctResult.stdout.trim()).toBe("/home/learner");

    const correctFs = await runtime.getFilesystemState();
    const evalCorrect = ChallengeEvaluator.evaluate(
      lesson1,
      correctResult,
      correctFs,
      "pwd"
    );

    // 8 & 9 & 10. Confirm validation succeeds, marked complete, confetti triggers ONCE
    expect(evalCorrect.passed).toBe(true);
    const outcome = ProgressStore.completeLesson(lesson1.id);
    expect(outcome.newlyCompleted).toBe(true);
    if (outcome.newlyCompleted) {
      triggerConfetti();
    }
    expect(confettiTriggerCount).toBe(1);

    // 11 & 12 & 13. Simulate page refresh
    const refreshedProgress = ProgressStore.load();
    expect(refreshedProgress.completedLessons).toContain("w1d1_01_pwd");
    expect(refreshedProgress.completedLessonIds).toContain("w1d1_01_pwd");
    expect(refreshedProgress.currentLessonId).toBe("w1d1_01_pwd");

    // 14. Confirm confetti does NOT replay on refresh
    expect(confettiTriggerCount).toBe(1);

    // 15. Verify that lesson 2 (ls) is now unlocked!
    const nextLesson = getNextLesson("w1d1_01_pwd")!;
    expect(nextLesson.id).toBe("w1d1_02_ls");
    const isNextUnlocked = ProgressStore.isLessonUnlocked(
      nextLesson.id,
      refreshedProgress.completedLessons
    );
    expect(isNextUnlocked).toBe(true);

    // 16. If learner re-runs 'pwd' while it's already solved:
    const rerunResult = await runtime.executeCommand("pwd");
    const evalRerun = ChallengeEvaluator.evaluate(lesson1, rerunResult, correctFs, "pwd");
    expect(evalRerun.passed).toBe(true);
    const rerunOutcome = ProgressStore.completeLesson(lesson1.id);
    expect(rerunOutcome.newlyCompleted).toBe(false); // Not newly completed!
    if (rerunOutcome.newlyCompleted) {
      triggerConfetti();
    }
    // Confetti still exactly 1!
    expect(confettiTriggerCount).toBe(1);
  });
});
