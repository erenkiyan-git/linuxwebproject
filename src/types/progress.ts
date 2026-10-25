import { z } from "zod";

export const SettingsSchema = z.object({
  theme: z.enum(["dark", "midnight"]).default("dark"),
  fontSize: z.number().min(11).max(24).default(14),
  fontFamily: z.string().default("JetBrains Mono"),
  soundEnabled: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  cursorBlink: z.boolean().default(true),
});

export type Settings = z.infer<typeof SettingsSchema>;

export interface ChallengeAttempt {
  challengeId: string;
  attempts: number;
  lastStatus: string;
  lastAttemptAt?: string;
}

export const LearnerProgressSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  completedLessons: z.array(z.string()).default([]),
  completedLessonIds: z.array(z.string()).default([]),
  completedChallenges: z.array(z.string()).default([]),
  completedChallengeIds: z.array(z.string()).default([]),
  currentLessonId: z.string().nullable().default("w1d1_01_pwd"),
  streak: z.number().default(1),
  lastActiveTimestamp: z.number().default(() => Date.now()),
  lastActiveAt: z.string().nullable().default(() => new Date().toISOString()),
  dailyActivity: z.record(z.string(), z.number()).default({}),
  commandExecutionCount: z.number().default(0),
  hintsRevealed: z.record(z.string(), z.number()).default({}),
  challengeAttempts: z.record(z.string(), z.object({
    challengeId: z.string(),
    attempts: z.number(),
    lastStatus: z.string(),
    lastAttemptAt: z.string().optional(),
  })).default({}),
  settings: SettingsSchema.default({
    theme: "dark",
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    soundEnabled: false,
    reducedMotion: false,
    cursorBlink: true,
  }),
});

export type LearnerProgress = z.infer<typeof LearnerProgressSchema>;

export const DEFAULT_LEARNER_PROGRESS: LearnerProgress = {
  schemaVersion: 1,
  completedLessons: [],
  completedLessonIds: [],
  completedChallenges: [],
  completedChallengeIds: [],
  currentLessonId: "w1d1_01_pwd",
  streak: 1,
  lastActiveTimestamp: Date.now(),
  lastActiveAt: new Date().toISOString(),
  dailyActivity: {
    [new Date().toISOString().split("T")[0]]: 1,
  },
  commandExecutionCount: 0,
  hintsRevealed: {},
  challengeAttempts: {},
  settings: {
    theme: "dark",
    fontSize: 14,
    fontFamily: "JetBrains Mono",
    soundEnabled: false,
    reducedMotion: false,
    cursorBlink: true,
  },
};
