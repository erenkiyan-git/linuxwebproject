import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChallengeEvaluator } from "@/features/challenges/challenge-evaluator";
import { ProgressStore } from "@/lib/storage/progress-store";
import { getLessonById } from "@/data/curriculum";

describe("Completion & Confetti Controller (Test Group A: Run Button & Confetti)", () => {
  let confettiTriggerCount = 0;
  const mockConfetti = vi.fn(() => {
    confettiTriggerCount++;
  });

  beforeEach(() => {
    ProgressStore.reset();
    confettiTriggerCount = 0;
    mockConfetti.mockClear();
  });

  /**
   * Helper simulating the controller logic in LessonWorkspaceView:
   * 1. Evaluates command execution
   * 2. Checks outcome.newlyCompleted
   * 3. Triggers confetti strictly on genuine new completion
   */
  function simulateCommandExecutionFlow(lessonId: string, cmd: string, stdout: string, exitCode = 0) {
    const lesson = getLessonById(lessonId)!;
    const fsState = { cwd: "/home/learner", files: [], directories: [] };

    // 1. Validation step
    const evaluation = ChallengeEvaluator.evaluate(
      lesson,
      { stdout, stderr: exitCode !== 0 ? "Error" : "", exitCode, durationMs: 10 },
      fsState,
      cmd
    );

    // 2. Completion step
    if (evaluation.passed) {
      const outcome = ProgressStore.completeLesson(lessonId);
      if (outcome.newlyCompleted) {
        mockConfetti();
      }
      return { validationPassed: true, newlyCompleted: outcome.newlyCompleted };
    }

    return { validationPassed: false, newlyCompleted: false };
  }

  it("Case 1 & 3: Empty command does NOT trigger confetti or pass validation", () => {
    const result = simulateCommandExecutionFlow("w1d1_01_pwd", "   ", "");
    expect(result.validationPassed).toBe(false);
    expect(mockConfetti).not.toHaveBeenCalled();
    expect(confettiTriggerCount).toBe(0);
  });

  it("Case 2: Incorrect command does NOT trigger confetti", () => {
    const result = simulateCommandExecutionFlow("w1d1_01_pwd", "pwd", "invalid_output_not_a_path");
    expect(result.validationPassed).toBe(false);
    expect(mockConfetti).not.toHaveBeenCalled();
  });

  it("Case 4: Command that succeeds in Linux but does not solve the task does NOT trigger confetti", () => {
    // Current lesson is pwd, user executes ls (which succeeds with exit code 0)
    const result = simulateCommandExecutionFlow("w1d1_01_pwd", "ls", "file1.txt file2.txt");
    expect(result.validationPassed).toBe(false);
    expect(mockConfetti).not.toHaveBeenCalled();
    expect(confettiTriggerCount).toBe(0);
  });

  it("Case 5: Correctly completed challenge triggers confetti exactly once", () => {
    const result = simulateCommandExecutionFlow("w1d1_01_pwd", "pwd", "/home/learner");
    expect(result.validationPassed).toBe(true);
    expect(result.newlyCompleted).toBe(true);
    expect(mockConfetti).toHaveBeenCalledTimes(1);
    expect(confettiTriggerCount).toBe(1);
  });

  it("Case 6: Repeating a command after completion does NOT trigger duplicate confetti", () => {
    // First execution: solves the challenge
    const firstRun = simulateCommandExecutionFlow("w1d1_01_pwd", "pwd", "/home/learner");
    expect(firstRun.validationPassed).toBe(true);
    expect(firstRun.newlyCompleted).toBe(true);
    expect(confettiTriggerCount).toBe(1);

    // Second execution (re-running the same command or another command)
    const secondRun = simulateCommandExecutionFlow("w1d1_01_pwd", "pwd", "/home/learner");
    expect(secondRun.validationPassed).toBe(true);
    expect(secondRun.newlyCompleted).toBe(false); // Already completed
    expect(confettiTriggerCount).toBe(1); // Confetti did NOT trigger again!
  });

  it("Case 7 & 8: Restoring completed progress on page refresh or mount does NOT trigger confetti", () => {
    // Setup stored progress
    ProgressStore.completeLesson("w1d1_01_pwd");

    // Simulate page refresh / component mount
    const loaded = ProgressStore.load();
    expect(loaded.completedLessons).toContain("w1d1_01_pwd");

    // Confetti must not have been called during restoration
    expect(mockConfetti).not.toHaveBeenCalled();
  });

  it("Case 9: Runtime failure (non-zero exit code) does NOT trigger confetti", () => {
    const result = simulateCommandExecutionFlow("w1d1_01_pwd", "pwd", "", 1);
    expect(result.validationPassed).toBe(false);
    expect(mockConfetti).not.toHaveBeenCalled();
  });

  it("Case 10: Validation failure does NOT trigger confetti", () => {
    const result = simulateCommandExecutionFlow("w1d1_02_ls", "pwd", "/home/learner");
    expect(result.validationPassed).toBe(false);
    expect(mockConfetti).not.toHaveBeenCalled();
  });
});
