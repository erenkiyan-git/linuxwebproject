"use client";

import React from "react";
import Link from "next/link";
import { useLearnerProgress } from "@/lib/storage/progress-store";
import { getWeeks, ALL_LESSONS, getLessonById } from "@/data/curriculum";
import {
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Terminal,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ProgressAnalyticsPage() {
  const { progress, overall, mounted } = useLearnerProgress();
  const weeks = getWeeks();

  // Calculate achievements
  const achievements = [
    {
      id: "first_command",
      title: "First Keystroke",
      description: "Ran your first command in the Linux terminal.",
      unlocked: progress.commandExecutionCount > 0,
      icon: Terminal,
    },
    {
      id: "fundamentals_complete",
      title: "Fundamentals Master",
      description: "Mastered all 50 Week 1 Linux fundamentals.",
      unlocked: weeks[0]?.days.flatMap((d) => d.lessons).every((l) => progress.completedLessons.includes(l.id)),
      icon: ShieldCheck,
    },
    {
      id: "pipeline_pro",
      title: "Pipeline Architect",
      description: "Chained commands using pipes, redirection, grep, sed, and awk.",
      unlocked: weeks[1]?.days.flatMap((d) => d.lessons).every((l) => progress.completedLessons.includes(l.id)),
      icon: Zap,
    },
    {
      id: "sys_admin",
      title: "System Detective",
      description: "Inspected kernel memory, disks, network interfaces, and logs.",
      unlocked: weeks[2]?.days.flatMap((d) => d.lessons).every((l) => progress.completedLessons.includes(l.id)),
      icon: TrendingUp,
    },
    {
      id: "graduate",
      title: "Terminal Zero Graduate",
      description: "Completed all 200 Linux commands in 28 days.",
      unlocked: progress.completedLessons.length >= 200,
      icon: Award,
    },
  ];

  const nextLessonId = progress.currentLessonId || "w1d1_01_pwd";
  const nextLesson = getLessonById(nextLessonId) || ALL_LESSONS[0];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171B24] border border-[#272D39] text-xs font-mono text-[#8B7CFF] mb-2">
          <Award className="w-3.5 h-3.5" />
          <span>Local Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F6FA]">
          Learning Progress & Analytics
        </h1>
        <p className="text-sm text-[#A0A8B8] mt-1 max-w-2xl">
          Detailed metrics calculated strictly from your local learning history. No fabricated analytics.
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-[#11141B] border border-[#272D39]">
          <div className="flex items-center justify-between text-xs text-[#A0A8B8] mb-2">
            <span>Overall Completion</span>
            <CheckCircle2 className="w-4 h-4 text-[#36D399]" />
          </div>
          <div className="text-2xl font-bold text-[#F4F6FA]">
            {mounted ? overall.percentage : 0}%
          </div>
          <div className="text-xs text-[#A0A8B8] mt-1">
            {mounted ? overall.completedCount : 0} of 200 commands mastered
          </div>
          <div className="w-full h-1.5 bg-[#090B10] rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-[#36D399] rounded-full transition-all duration-500"
              style={{ width: `${mounted ? overall.percentage : 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#11141B] border border-[#272D39]">
          <div className="flex items-center justify-between text-xs text-[#A0A8B8] mb-2">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-[#F6C66A] fill-current" />
          </div>
          <div className="text-2xl font-bold text-[#F6C66A]">
            {mounted ? progress.streak : 1} Day{progress.streak > 1 ? "s" : ""}
          </div>
          <div className="text-xs text-[#A0A8B8] mt-1">
            Daily practice consistency
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#11141B] border border-[#272D39]">
          <div className="flex items-center justify-between text-xs text-[#A0A8B8] mb-2">
            <span>Commands Executed</span>
            <Terminal className="w-4 h-4 text-[#8B7CFF]" />
          </div>
          <div className="text-2xl font-bold text-[#8B7CFF]">
            {mounted ? progress.commandExecutionCount : 0}
          </div>
          <div className="text-xs text-[#A0A8B8] mt-1">
            Real terminal runs
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#11141B] border border-[#272D39]">
          <div className="flex items-center justify-between text-xs text-[#A0A8B8] mb-2">
            <span>Curriculum Progress</span>
            <Calendar className="w-4 h-4 text-[#A0A8B8]" />
          </div>
          <div className="text-2xl font-bold text-[#F4F6FA]">
            Day {nextLesson.day} / 28
          </div>
          <div className="text-xs text-[#A0A8B8] mt-1">
            Week {nextLesson.week} active
          </div>
        </div>
      </div>

      {/* WEEKLY BREAKDOWN PROGRESS BARS */}
      <div className="p-6 rounded-xl bg-[#11141B] border border-[#272D39] mb-8">
        <h2 className="text-base font-bold text-[#F4F6FA] mb-4">
          Weekly Track Completion
        </h2>
        <div className="space-y-4">
          {weeks.map((week) => {
            const completedInWeek = week.days
              .flatMap((d) => d.lessons)
              .filter((l) => progress.completedLessons.includes(l.id)).length;
            const percentage = Math.round((completedInWeek / week.totalCommands) * 100);

            return (
              <div key={week.week} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#8B7CFF]">
                      Week {week.week}:
                    </span>
                    <span className="font-medium text-[#F4F6FA]">{week.theme}</span>
                  </div>
                  <span className="font-mono text-[#A0A8B8]">
                    {completedInWeek} / {week.totalCommands} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#090B10] rounded-full overflow-hidden border border-[#272D39]">
                  <div
                    className="h-full bg-[#8B7CFF] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MILESTONE ACHIEVEMENTS */}
      <div className="p-6 rounded-xl bg-[#11141B] border border-[#272D39] mb-8">
        <h2 className="text-base font-bold text-[#F4F6FA] mb-4">
          Milestones & Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = ach.icon;
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${
                  ach.unlocked
                    ? "bg-[#171B24] border-[#36D399]/40 text-[#F4F6FA]"
                    : "bg-[#090B10] border-[#272D39] opacity-50 text-[#A0A8B8]"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    ach.unlocked
                      ? "bg-[#36D399]/10 text-[#36D399] border border-[#36D399]/30"
                      : "bg-[#171B24] text-[#A0A8B8] border border-[#272D39]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>{ach.title}</span>
                    {ach.unlocked && <CheckCircle2 className="w-3 h-3 text-[#36D399]" />}
                  </div>
                  <p className="text-[11px] text-[#A0A8B8] mt-0.5 leading-relaxed">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESUME CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#171B24] to-[#11141B] border border-[#8B7CFF]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#8B7CFF] mb-1">Recommended Next Step</div>
          <div className="text-base font-bold text-[#F4F6FA]">
            Continue Day {nextLesson.day}: {nextLesson.title}
          </div>
          <p className="text-xs text-[#A0A8B8] mt-0.5">
            Command: <code className="text-[#8B7CFF]">{nextLesson.commandName}</code>
          </p>
        </div>
        <Link
          href={`/lesson/${nextLesson.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] text-xs font-bold transition-all shadow-md shadow-[#8B7CFF]/20"
        >
          <span>Jump to Lesson</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
