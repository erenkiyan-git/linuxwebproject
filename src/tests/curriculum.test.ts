import { describe, it, expect } from "vitest";
import {
  ALL_LESSONS,
  getWeeks,
  getDayModules,
  getLessonById,
  getAllCommandsReference,
} from "@/data/curriculum";
import { CommandLessonSchema } from "@/types/curriculum";

describe("Curriculum Validation Suite", () => {
  it("contains exactly 200 command lessons", () => {
    expect(ALL_LESSONS.length).toBe(200);
  });

  it("has 50 command lessons per week", () => {
    const weeks = getWeeks();
    expect(weeks.length).toBe(4);
    weeks.forEach((w) => {
      expect(w.totalCommands).toBe(50);
    });
  });

  it("spans 28 days with every day having at least one lesson", () => {
    const days = getDayModules();
    expect(days.length).toBe(28);
    days.forEach((d) => {
      expect(d.lessons.length).toBeGreaterThan(0);
    });
  });

  it("every lesson has a unique ID and matches the CommandLessonSchema", () => {
    const idSet = new Set<string>();
    ALL_LESSONS.forEach((lesson) => {
      expect(idSet.has(lesson.id)).toBe(false);
      idSet.add(lesson.id);

      const parsed = CommandLessonSchema.safeParse(lesson);
      expect(parsed.success).toBe(true);
      expect(lesson.examples.length).toBeGreaterThan(0);
      expect(lesson.challenge.hints.length).toBeGreaterThan(0);
      expect(lesson.challenge.instruction.length).toBeGreaterThan(10);
    });
  });

  it("provides comprehensive command reference items for all 200 lessons", () => {
    const ref = getAllCommandsReference();
    expect(ref.length).toBe(200);
    ref.forEach((item) => {
      expect(item.name).toBeTruthy();
      expect(item.syntax).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(getLessonById(item.lessonId)).toBeDefined();
    });
  });
});
