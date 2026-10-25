"use client";

import { useState, useEffect } from "react";
import { DEFAULT_LEARNER_PROGRESS, LearnerProgress, LearnerProgressSchema, Settings } from "@/types/progress";
import { ALL_LESSONS, getLessonById } from "@/data/curriculum";

const STORAGE_KEY = "terminal-zero:progress:v1";
const LEGACY_STORAGE_KEY = "terminal_zero_progress_v1";

export interface CompletionOutcome {
  newlyCompleted: boolean;
  progress: LearnerProgress;
}

class StorageDriver {
  private memoryStore = new Map<string, string>();

  getItem(key: string): string | null {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // storage quota / privacy mode error
      }
    }
    return this.memoryStore.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // storage quota / privacy mode error
      }
    }
    this.memoryStore.set(key, value);
  }

  removeItem(key: string): void {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // storage quota / privacy mode error
      }
    }
    this.memoryStore.delete(key);
  }

  clear(): void {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      try {
        window.localStorage.clear();
      } catch {
        // storage quota error
      }
    }
    this.memoryStore.clear();
  }
}

export const storageDriver = new StorageDriver();

export class ProgressStore {
  static getRawItem(key: string): string | null {
    return storageDriver.getItem(key);
  }

  static setRawItem(key: string, val: string): void {
    storageDriver.setItem(key, val);
  }

  /**
   * Safe load with schema validation, legacy key migration, and corrupted data recovery.
   */
  static load(): LearnerProgress {
    try {
      let raw = storageDriver.getItem(STORAGE_KEY);

      // Attempt legacy key migration if primary key is not set
      if (!raw) {
        const legacy = storageDriver.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          raw = legacy;
          try {
            storageDriver.setItem(STORAGE_KEY, legacy);
          } catch {
            // ignore quota error on migration
          }
        }
      }

      if (!raw) return DEFAULT_LEARNER_PROGRESS;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (jsonErr) {
        console.error("Malformed JSON in progress localStorage, falling back to defaults", jsonErr);
        return DEFAULT_LEARNER_PROGRESS;
      }

      // If parsed is not an object, fallback safely
      if (!parsed || typeof parsed !== "object") {
        return DEFAULT_LEARNER_PROGRESS;
      }

      const rawObj = parsed as Record<string, unknown>;

      // Merge completedLessonIds and completedLessons safely
      const l1 = Array.isArray(rawObj.completedLessonIds) ? rawObj.completedLessonIds : [];
      const l2 = Array.isArray(rawObj.completedLessons) ? rawObj.completedLessons : [];
      const validLessonIds = Array.from(new Set([...l1, ...l2])).filter((id): id is string => typeof id === "string");

      // Merge completedChallengeIds and completedChallenges safely
      const c1 = Array.isArray(rawObj.completedChallengeIds) ? rawObj.completedChallengeIds : [];
      const c2 = Array.isArray(rawObj.completedChallenges) ? rawObj.completedChallenges : [];
      const validChallengeIds = Array.from(new Set([...c1, ...c2])).filter((id): id is string => typeof id === "string");

      const normalized: Record<string, unknown> = {
        ...rawObj,
        schemaVersion: 1,
        completedLessons: validLessonIds,
        completedLessonIds: validLessonIds,
        completedChallenges: validChallengeIds,
        completedChallengeIds: validChallengeIds,
        currentLessonId: typeof rawObj.currentLessonId === "string" ? rawObj.currentLessonId : "w1d1_01_pwd",
        streak: typeof rawObj.streak === "number" && rawObj.streak > 0 ? rawObj.streak : 1,
        lastActiveTimestamp: typeof rawObj.lastActiveTimestamp === "number" ? rawObj.lastActiveTimestamp : Date.now(),
        lastActiveAt: typeof rawObj.lastActiveAt === "string" ? rawObj.lastActiveAt : new Date().toISOString(),
        dailyActivity: rawObj.dailyActivity && typeof rawObj.dailyActivity === "object" ? rawObj.dailyActivity : {},
        commandExecutionCount: typeof rawObj.commandExecutionCount === "number" ? rawObj.commandExecutionCount : 0,
        hintsRevealed: rawObj.hintsRevealed && typeof rawObj.hintsRevealed === "object" ? rawObj.hintsRevealed : {},
        challengeAttempts: rawObj.challengeAttempts && typeof rawObj.challengeAttempts === "object" ? rawObj.challengeAttempts : {},
      };

      const validated = LearnerProgressSchema.safeParse(normalized);
      if (validated.success) {
        return validated.data;
      }

      console.warn("Storage schema mismatch after normalization, using safe defaults", validated.error);
      return {
        ...DEFAULT_LEARNER_PROGRESS,
        completedLessons: validLessonIds,
        completedLessonIds: validLessonIds,
        completedChallenges: validChallengeIds,
        completedChallengeIds: validChallengeIds,
      };
    } catch (err) {
      console.error("Failed to read progress from storage driver", err);
      return DEFAULT_LEARNER_PROGRESS;
    }
  }

  /**
   * Persist learner progress safely.
   */
  static save(data: LearnerProgress): void {
    try {
      const payload: LearnerProgress = {
        ...data,
        completedLessonIds: Array.from(new Set([...data.completedLessons, ...data.completedLessonIds])),
        completedLessons: Array.from(new Set([...data.completedLessons, ...data.completedLessonIds])),
        completedChallengeIds: Array.from(new Set([...data.completedChallenges, ...data.completedChallengeIds])),
        completedChallenges: Array.from(new Set([...data.completedChallenges, ...data.completedChallengeIds])),
        lastActiveAt: new Date().toISOString(),
        lastActiveTimestamp: Date.now(),
      };

      storageDriver.setItem(STORAGE_KEY, JSON.stringify(payload));
      // Dispatch storage event for cross-component sync in browser environments
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tz_progress_updated"));
      }
    } catch (err) {
      console.error("Failed to persist progress", err);
    }
  }

  /**
   * Reset stored learning progress.
   */
  static reset(): void {
    try {
      storageDriver.removeItem(STORAGE_KEY);
      storageDriver.removeItem(LEGACY_STORAGE_KEY);
      storageDriver.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tz_progress_updated"));
      }
    } catch (err) {
      console.error("Failed to reset progress", err);
    }
  }

  /**
   * Mark a lesson complete. Distinguishes newly completed lessons from repeated completions.
   */
  static completeLesson(lessonId: string): CompletionOutcome {
    const current = this.load();
    const existingSet = new Set([...current.completedLessons, ...current.completedLessonIds]);
    const wasAlreadyCompleted = existingSet.has(lessonId);

    existingSet.add(lessonId);
    const completedList = Array.from(existingSet);

    const challengesSet = new Set([...current.completedChallenges, ...current.completedChallengeIds]);
    challengesSet.add(lessonId);
    const challengesList = Array.from(challengesSet);

    const todayStr = new Date().toISOString().split("T")[0];
    const dailyActivity = { ...current.dailyActivity };
    dailyActivity[todayStr] = (dailyActivity[todayStr] || 0) + 1;

    // Calculate streak
    const streak = this.computeStreak(current.lastActiveTimestamp, current.streak);

    const updated: LearnerProgress = {
      ...current,
      completedLessons: completedList,
      completedLessonIds: completedList,
      completedChallenges: challengesList,
      completedChallengeIds: challengesList,
      currentLessonId: lessonId,
      lastActiveTimestamp: Date.now(),
      lastActiveAt: new Date().toISOString(),
      dailyActivity,
      streak,
      commandExecutionCount: current.commandExecutionCount + 1,
    };

    this.save(updated);
    return {
      newlyCompleted: !wasAlreadyCompleted,
      progress: updated,
    };
  }

  /**
   * Record a validation attempt without completing the lesson.
   */
  static recordAttempt(lessonId: string, status: string): LearnerProgress {
    const current = this.load();
    const attemptsMap = { ...(current.challengeAttempts || {}) };
    const prev = attemptsMap[lessonId] || {
      challengeId: lessonId,
      attempts: 0,
      lastStatus: "not_started",
    };

    attemptsMap[lessonId] = {
      challengeId: lessonId,
      attempts: prev.attempts + 1,
      lastStatus: status,
      lastAttemptAt: new Date().toISOString(),
    };

    const updated: LearnerProgress = {
      ...current,
      challengeAttempts: attemptsMap,
      commandExecutionCount: current.commandExecutionCount + 1,
      lastActiveTimestamp: Date.now(),
      lastActiveAt: new Date().toISOString(),
    };

    this.save(updated);
    return updated;
  }

  static isLessonUnlocked(lessonId: string, completedLessons: string[]): boolean {
    const lesson = getLessonById(lessonId);
    if (!lesson) return false;
    // First lesson is always unlocked
    if (lesson.sequence === 1) return true;

    // Check prerequisites
    if (lesson.prerequisites.length > 0) {
      const allPrereqsMet = lesson.prerequisites.every((req) =>
        completedLessons.some((id) => id.includes(req))
      );
      if (allPrereqsMet) return true;
    }

    // Previous sequence lesson is completed
    const prevSeq = lesson.sequence - 1;
    const prevLesson = ALL_LESSONS.find((l) => l.sequence === prevSeq);
    if (prevLesson && completedLessons.includes(prevLesson.id)) {
      return true;
    }

    return completedLessons.includes(lesson.id);
  }

  private static computeStreak(lastTimestamp: number, currentStreak: number): number {
    const now = new Date();
    const last = new Date(lastTimestamp);

    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return Math.max(1, currentStreak);
    if (diffDays === 1) return currentStreak + 1;
    return 1; // reset streak
  }
}

export function useLearnerProgress() {
  const [progress, setProgress] = useState<LearnerProgress>(DEFAULT_LEARNER_PROGRESS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(ProgressStore.load());

    const handleUpdate = () => {
      setProgress(ProgressStore.load());
    };

    window.addEventListener("tz_progress_updated", handleUpdate);
    return () => window.removeEventListener("tz_progress_updated", handleUpdate);
  }, []);

  const markComplete = (lessonId: string): CompletionOutcome => {
    const outcome = ProgressStore.completeLesson(lessonId);
    setProgress(outcome.progress);
    return outcome;
  };

  const recordAttempt = (lessonId: string, status: string): LearnerProgress => {
    const updated = ProgressStore.recordAttempt(lessonId, status);
    setProgress(updated);
    return updated;
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    const current = ProgressStore.load();
    const updated: LearnerProgress = {
      ...current,
      settings: { ...current.settings, ...newSettings },
    };
    ProgressStore.save(updated);
    setProgress(updated);
  };

  const resetAll = () => {
    ProgressStore.reset();
    setProgress(DEFAULT_LEARNER_PROGRESS);
  };

  // Derive unique completed IDs
  const uniqueCompleted = Array.from(
    new Set([...progress.completedLessons, ...progress.completedLessonIds])
  );

  const overall = {
    completedCount: uniqueCompleted.length,
    totalCount: ALL_LESSONS.length,
    percentage: Math.round((uniqueCompleted.length / ALL_LESSONS.length) * 100),
  };

  return {
    progress,
    mounted,
    markComplete,
    recordAttempt,
    updateSettings,
    resetAll,
    overall,
    isUnlocked: (lessonId: string) =>
      ProgressStore.isLessonUnlocked(lessonId, uniqueCompleted),
  };
}
