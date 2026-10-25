import { describe, it, expect, beforeEach } from "vitest";
import { ProgressStore } from "@/lib/storage/progress-store";
import { DEFAULT_LEARNER_PROGRESS } from "@/types/progress";

describe("ProgressStore & Persistence Suite (Test Group C: LocalStorage)", () => {
  beforeEach(() => {
    // Reset simulated storage before each test
    ProgressStore.reset();
  });

  it("loads default learner progress when storage is empty", () => {
    const loaded = ProgressStore.load();
    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.completedLessons).toEqual([]);
    expect(loaded.completedLessonIds).toEqual([]);
    expect(loaded.streak).toBe(1);
  });

  it("marks a lesson complete, records challenge, and updates daily activity", () => {
    const outcome = ProgressStore.completeLesson("w1d1_01_pwd");
    expect(outcome.newlyCompleted).toBe(true);
    expect(outcome.progress.completedLessons).toContain("w1d1_01_pwd");
    expect(outcome.progress.completedLessonIds).toContain("w1d1_01_pwd");
    expect(outcome.progress.completedChallenges).toContain("w1d1_01_pwd");
    expect(outcome.progress.commandExecutionCount).toBeGreaterThan(0);
    expect(outcome.progress.currentLessonId).toBe("w1d1_01_pwd");
  });

  it("restores completed lessons and challenges after simulating page reload", () => {
    // 1. Complete lesson 1
    ProgressStore.completeLesson("w1d1_01_pwd");

    // 2. Simulate page reload by reading fresh from storage
    const restored = ProgressStore.load();
    expect(restored.completedLessons).toContain("w1d1_01_pwd");
    expect(restored.completedLessonIds).toContain("w1d1_01_pwd");
    expect(restored.currentLessonId).toBe("w1d1_01_pwd");
  });

  it("distinguishes newly completed lessons from repeated completions", () => {
    const firstAttempt = ProgressStore.completeLesson("w1d1_01_pwd");
    expect(firstAttempt.newlyCompleted).toBe(true);

    // Re-running or repeating the same challenge
    const secondAttempt = ProgressStore.completeLesson("w1d1_01_pwd");
    expect(secondAttempt.newlyCompleted).toBe(false);

    // Ensure list does not contain duplicates
    const counts = secondAttempt.progress.completedLessons.filter((id) => id === "w1d1_01_pwd").length;
    expect(counts).toBe(1);
  });

  it("gracefully recovers from malformed JSON without crashing", () => {
    ProgressStore.setRawItem("terminal-zero:progress:v1", "{ malformed JSON !!");
    const loaded = ProgressStore.load();
    expect(loaded).toBeDefined();
    expect(loaded.completedLessons).toEqual([]);
  });

  it("migrates from legacy key terminal_zero_progress_v1 when present", () => {
    const legacyPayload = {
      ...DEFAULT_LEARNER_PROGRESS,
      completedLessons: ["w1d1_01_pwd", "w1d1_02_ls"],
      currentLessonId: "w1d1_02_ls",
    };
    ProgressStore.setRawItem("terminal_zero_progress_v1", JSON.stringify(legacyPayload));

    const loaded = ProgressStore.load();
    expect(loaded.completedLessons).toContain("w1d1_01_pwd");
    expect(loaded.completedLessons).toContain("w1d1_02_ls");
    expect(loaded.currentLessonId).toBe("w1d1_02_ls");

    // Verify it migrated to primary key
    const primaryRaw = ProgressStore.getRawItem("terminal-zero:progress:v1");
    expect(primaryRaw).toBeDefined();
  });

  it("unlocks lesson 1 by default", () => {
    const unlocked = ProgressStore.isLessonUnlocked("w1d1_01_pwd", []);
    expect(unlocked).toBe(true);
  });

  it("unlocks subsequent lesson when previous is completed", () => {
    // w1d1_02_ls is sequence 2
    const unlockedBefore = ProgressStore.isLessonUnlocked("w1d1_02_ls", []);
    expect(unlockedBefore).toBe(false);

    const unlockedAfter = ProgressStore.isLessonUnlocked("w1d1_02_ls", ["w1d1_01_pwd"]);
    expect(unlockedAfter).toBe(true);
  });

  it("clears all keys upon reset", () => {
    ProgressStore.completeLesson("w1d1_01_pwd");
    ProgressStore.reset();

    const loaded = ProgressStore.load();
    expect(loaded.completedLessons).toEqual([]);
    expect(ProgressStore.getRawItem("terminal-zero:progress:v1")).toBeNull();
  });
});
