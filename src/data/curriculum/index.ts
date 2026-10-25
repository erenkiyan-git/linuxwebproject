import { CommandLesson, CommandLessonSchema, DayModule, WeekCurriculum } from "@/types/curriculum";
import { WEEK_1_LESSONS } from "./week1";
import { WEEK_2_LESSONS } from "./week2";
import { WEEK_3_LESSONS } from "./week3";
import { WEEK_4_LESSONS } from "./week4";

// Aggregate all 200 lessons across 4 weeks
export const ALL_LESSONS: CommandLesson[] = [
  ...WEEK_1_LESSONS,
  ...WEEK_2_LESSONS,
  ...WEEK_3_LESSONS,
  ...WEEK_4_LESSONS,
];

// Validate all lessons at initialization
ALL_LESSONS.forEach((lesson) => {
  const result = CommandLessonSchema.safeParse(lesson);
  if (!result.success) {
    console.error(`Invalid curriculum lesson schema for ${lesson.id}:`, result.error);
    throw new Error(`Curriculum validation failed for lesson ${lesson.id}`);
  }
});

// Day metadata titles & themes
export const DAY_THEMES: Record<number, { title: string; description: string }> = {
  1: { title: "Navigation Basics", description: "Learn how to locate where you are and explore directories." },
  2: { title: "File Creation & Manipulation", description: "Create, copy, move, rename, and delete files." },
  3: { title: "Directory Cleanups & Reading Content", description: "Remove directories and inspect text file contents." },
  4: { title: "File Metadata & Information", description: "Inspect inodes, counts, sizes, and file types." },
  5: { title: "Searching & Paths", description: "Locate executables, parse paths, and search files by name." },
  6: { title: "File Attributes & Permissions", description: "Control user/group/other read, write, and execute permissions." },
  7: { title: "Fundamentals Review & System Identities", description: "Review basic concepts and inspect user identities." },

  8: { title: "Standard Streams & Redirection", description: "Direct stdin, stdout, stderr, and tee into files." },
  9: { title: "Pipes & Output Pipelines", description: "Chain commands into powerful text processing streams." },
  10: { title: "Pattern Matching with grep", description: "Filter lines with standard and extended regular expressions." },
  11: { title: "Text Transformation & Cutting", description: "Extract columns, translate characters, and format tables." },
  12: { title: "Stream Editing with sed", description: "Transform text on the fly with substitution and deletion." },
  13: { title: "Data Processing with awk", description: "Extract delimited fields, evaluate conditions, and format reports." },
  14: { title: "Process Inspection & Management", description: "Monitor active processes, CPU, memory, and send signals." },

  15: { title: "Memory & Hardware Inspection", description: "Read virtual kernel filesystems and inspect RAM and CPU." },
  16: { title: "Disks, Filesystems, & Devices", description: "Inspect storage block devices, mount points, and partition tables." },
  17: { title: "Network Interfaces & Configuration", description: "Inspect network devices, IP assignments, and test connectivity." },
  18: { title: "Sockets & Port Inspection", description: "Check open ports, listening sockets, and connection states." },
  19: { title: "Web Requests & Data Retrieval", description: "Download files and interact with REST APIs using curl and wget." },
  20: { title: "DNS & Domain Discovery", description: "Query domain names, nameservers, and NSS host resolution." },
  21: { title: "Services, Logs, & System Management", description: "Inspect system logs, scheduled cron tasks, and service managers." },

  22: { title: "Environment & Shell Variables", description: "Manage exported variables, exit statuses, and shell parameters." },
  23: { title: "Aliases, Shell Builtins, & Sourcing", description: "Customize shell shortcuts, enforce strict mode, and evaluate code." },
  24: { title: "Scripting Essentials: Conditionals & Tests", description: "Write branching logic, evaluate tests, and inspect exit codes." },
  25: { title: "Scripting Loops & Functions", description: "Automate batch jobs with loops, math, and modular functions." },
  26: { title: "Hashes, Cryptography, & File Integrity", description: "Compute SHA-256 sums, encode base64, and generate keys." },
  27: { title: "Archiving, Compression, & Transfers", description: "Bundle files into tar archives, compress with gzip, and sync." },
  28: { title: "Security Permissions, Privileges, & Graduation", description: "Audit permissions, master shell shortcuts, and graduate Terminal Zero!" },
};

export const WEEK_THEMES: Record<number, { theme: string; description: string }> = {
  1: {
    theme: "Linux Fundamentals",
    description: "Master filesystem navigation, file creation, permissions, inspection, and path operations.",
  },
  2: {
    theme: "Text Processing, Pipes, & Processes",
    description: "Learn stream redirection, multi-stage pipelines, grep, sed, awk, and process control.",
  },
  3: {
    theme: "Networking, Services, & System Inspection",
    description: "Inspect system memory, disks, networking interfaces, sockets, web APIs, DNS, and logs.",
  },
  4: {
    theme: "Bash Scripting, Environment, & Security",
    description: "Automate tasks with loops, functions, conditionals, hashing, archiving, and permission security.",
  },
};

export function getAllLessons(): CommandLesson[] {
  return ALL_LESSONS;
}

export function getLessonById(id: string): CommandLesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getLessonBySequence(seq: number): CommandLesson | undefined {
  return ALL_LESSONS.find((l) => l.sequence === seq);
}

export function getLessonsByWeek(week: number): CommandLesson[] {
  return ALL_LESSONS.filter((l) => l.week === week);
}

export function getLessonsByDay(day: number): CommandLesson[] {
  return ALL_LESSONS.filter((l) => l.day === day);
}

export function getNextLesson(currentId: string): CommandLesson | undefined {
  const current = getLessonById(currentId);
  if (!current) return undefined;
  return getLessonBySequence(current.sequence + 1);
}

export function getPreviousLesson(currentId: string): CommandLesson | undefined {
  const current = getLessonById(currentId);
  if (!current) return undefined;
  return getLessonBySequence(current.sequence - 1);
}

export function getDayModules(): DayModule[] {
  const days: DayModule[] = [];
  for (let d = 1; d <= 28; d++) {
    const lessons = getLessonsByDay(d);
    const week = Math.ceil(d / 7);
    const themeInfo = DAY_THEMES[d] || {
      title: `Day ${d}`,
      description: "Linux hands-on mastery lesson module.",
    };
    days.push({
      day: d,
      week,
      title: themeInfo.title,
      description: themeInfo.description,
      estimatedMinutes: lessons.reduce((acc, l) => acc + (l.estimatedMinutes || 4), 0),
      commandCount: lessons.length,
      lessons,
    });
  }
  return days;
}

export function getWeeks(): WeekCurriculum[] {
  const allDays = getDayModules();
  const weeks: WeekCurriculum[] = [];
  for (let w = 1; w <= 4; w++) {
    const weekDays = allDays.filter((d) => d.week === w);
    const totalCommands = weekDays.reduce((acc, d) => acc + d.commandCount, 0);
    const info = WEEK_THEMES[w] || {
      theme: `Week ${w}`,
      description: "Weekly Linux learning track.",
    };
    weeks.push({
      week: w,
      theme: info.theme,
      description: info.description,
      days: weekDays,
      totalCommands,
    });
  }
  return weeks;
}

export interface CommandReferenceItem {
  name: string;
  category: string;
  syntax: string;
  description: string;
  examples: string[];
  lessonId: string;
  week: number;
  day: number;
  availability: CommandLesson["availability"];
}

export function getAllCommandsReference(): CommandReferenceItem[] {
  return ALL_LESSONS.map((l) => ({
    name: l.commandName,
    category: l.category,
    syntax: l.syntax,
    description: l.explanation,
    examples: l.examples,
    lessonId: l.id,
    week: l.week,
    day: l.day,
    availability: l.availability,
  }));
}
