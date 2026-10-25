import { z } from "zod";

export const AvailabilitySchema = z.object({
  defaultInstalled: z.boolean(),
  requiredPackages: z.array(z.string()),
  requiresRoot: z.boolean(),
  requiresNetwork: z.boolean(),
  browserRuntimeSupported: z.boolean(),
  limitations: z.array(z.string()),
});

export type ExecutionStatus = "idle" | "running" | "succeeded" | "failed";
export type ValidationStatus = "not_started" | "running" | "checking" | "passed" | "failed";
export type ChallengeStatus = "locked" | "available" | "completed";
export type LearningStage = "learn" | "practice" | "validate" | "progress";

export interface ValidationResult {
  passed: boolean;
  message: string;
  expected?: string;
  detected?: string;
  tip?: string;
  details?: string;
  strategyUsed?: string;
}

export const ChallengeSchema = z.object({
  instruction: z.string(),
  objective: z.string().optional(),
  startingDirectory: z.string().optional(),
  starterFiles: z.record(z.string(), z.string()).optional(),
  expectedBehavior: z.string(),
  validationStrategy: z.enum([
    "output_match",
    "exit_code",
    "filesystem_state",
    "pattern_match",
    "command_executed",
    "working_directory",
    "file_content",
    "permissions",
    "interactive",
  ]),
  validationType: z.string().optional(),
  expectedOutput: z.string().optional(),
  outputPattern: z.string().optional(),
  expectedFiles: z.array(z.string()).optional(),
  expectedDirectories: z.array(z.string()).optional(),
  expectedWorkingDir: z.string().optional(),
  expectedPermissions: z.record(z.string(), z.string()).optional(),
  fileContentsCheck: z.record(z.string(), z.string()).optional(),
  requiredTechnique: z.string().optional(),
  hints: z.array(z.string()),
  solution: z.string().optional(),
  solutionExplanation: z.string().optional(),
  commonMistakes: z.array(z.string()).optional(),
  whyItMatters: z.string().optional(),
  successMessage: z.string(),
});

export const CommandLessonSchema = z.object({
  id: z.string(),
  week: z.number().min(1).max(4),
  day: z.number().min(1).max(28),
  sequence: z.number().min(1).max(200),

  title: z.string(),
  category: z.string(),
  learningObjective: z.string(),
  explanation: z.string(),

  commandName: z.string(),
  syntax: z.string(),
  examples: z.array(z.string()),

  prerequisites: z.array(z.string()),
  estimatedMinutes: z.number().default(5),

  availability: AvailabilitySchema,
  challenge: ChallengeSchema,
});

export type CommandLesson = z.infer<typeof CommandLessonSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;

export interface DayModule {
  day: number;
  week: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  commandCount: number;
  lessons: CommandLesson[];
}

export interface WeekCurriculum {
  week: number;
  theme: string;
  description: string;
  days: DayModule[];
  totalCommands: number;
}
