"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLearnerProgress } from "@/lib/storage/progress-store";
import { getWeeks, getLessonById, ALL_LESSONS } from "@/data/curriculum";
import {
  Play,
  CheckCircle2,
  Lock,
  Flame,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Terminal,
} from "lucide-react";

export default function LearnDashboardPage() {
  const { progress, overall, mounted, isUnlocked } = useLearnerProgress();
  const weeks = getWeeks();
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Find active lesson
  const currentLessonId = progress.currentLessonId || "w1d1_01_pwd";
  const activeLesson = getLessonById(currentLessonId) || ALL_LESSONS[0];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* WELCOME & REAL STATS HERO */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171B24] border border-[#272D39] text-xs font-mono text-[#8B7CFF] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Local Learner Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F6FA]">
              Welcome back.
            </h1>
            <p className="text-sm text-[#A0A8B8] mt-1">
              Ready to continue your Linux journey? Master 200 commands in 28 days.
            </p>
          </div>

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#11141B] border border-[#272D39] rounded-lg">
              <div className="text-[11px] text-[#A0A8B8] font-medium">Daily Streak</div>
              <div className="text-lg font-bold text-[#F6C66A] flex items-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 fill-current" />
                <span>{mounted ? progress.streak : 1}d</span>
              </div>
            </div>

            <div className="p-3 bg-[#11141B] border border-[#272D39] rounded-lg">
              <div className="text-[11px] text-[#A0A8B8] font-medium">Mastery</div>
              <div className="text-lg font-bold text-[#8B7CFF] mt-0.5">
                {mounted ? overall.percentage : 0}%
              </div>
            </div>

            <div className="p-3 bg-[#11141B] border border-[#272D39] rounded-lg">
              <div className="text-[11px] text-[#A0A8B8] font-medium">Commands</div>
              <div className="text-lg font-bold text-[#36D399] mt-0.5">
                {mounted ? overall.completedCount : 0}/200
              </div>
            </div>

            <div className="p-3 bg-[#11141B] border border-[#272D39] rounded-lg">
              <div className="text-[11px] text-[#A0A8B8] font-medium">Active Day</div>
              <div className="text-lg font-bold text-[#F4F6FA] mt-0.5">
                Day {activeLesson.day}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTINUE LEARNING CARD */}
      <div className="mb-10 p-6 rounded-xl bg-[#11141B] border border-[#8B7CFF]/40 shadow-xl shadow-[#8B7CFF]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B7CFF]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-[#8B7CFF]/20 text-[#8B7CFF] text-[11px] font-mono rounded border border-[#8B7CFF]/40">
                Week {activeLesson.week} • Day {activeLesson.day} • Unit {activeLesson.sequence}
              </span>
              <span className="text-xs text-[#A0A8B8]">Recommended Next Action</span>
            </div>
            <h2 className="text-xl font-bold text-[#F4F6FA] mb-2">
              {activeLesson.title} ({activeLesson.commandName})
            </h2>
            <p className="text-sm text-[#A0A8B8] leading-relaxed mb-4">
              {activeLesson.explanation}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A0A8B8]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#8B7CFF]" />
                {activeLesson.estimatedMinutes} mins
              </span>
              <span className="flex items-center gap-1 font-mono text-[#F4F6FA]">
                <Terminal className="w-3.5 h-3.5 text-[#36D399]" />
                syntax: {activeLesson.syntax}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/lesson/${activeLesson.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] font-bold text-sm rounded-md transition-all shadow-md shadow-[#8B7CFF]/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Lesson</span>
            </Link>
          </div>
        </div>
      </div>

      {/* WEEKLY CURRICULUM SELECTOR */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#F4F6FA] mb-4">
          Four-Week Learning Path
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeks.map((week) => {
            const isSelected = selectedWeek === week.week;
            const weekCompletedCount = week.days
              .flatMap((d) => d.lessons)
              .filter((l) => progress.completedLessons.includes(l.id)).length;
            const weekPercent = Math.round((weekCompletedCount / week.totalCommands) * 100);

            return (
              <button
                key={week.week}
                onClick={() => setSelectedWeek(week.week)}
                className={`p-4 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#171B24] border-[#8B7CFF] shadow-lg shadow-[#8B7CFF]/10"
                    : "bg-[#11141B] border-[#272D39] hover:border-[#8B7CFF]/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-[#8B7CFF]">
                      WEEK {week.week}
                    </span>
                    <span className="font-mono text-[#A0A8B8]">
                      {weekCompletedCount}/{week.totalCommands}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#F4F6FA] mb-1 line-clamp-1">
                    {week.theme}
                  </h4>
                  <p className="text-xs text-[#A0A8B8] line-clamp-2">
                    {week.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#272D39]/60 w-full">
                  <div className="w-full h-1.5 bg-[#090B10] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B7CFF] rounded-full transition-all duration-300"
                      style={{ width: `${weekPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DAILY MODULES FOR SELECTED WEEK */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#F4F6FA]">
            Week {selectedWeek} Days & Daily Modules
          </h3>
          <span className="text-xs text-[#A0A8B8]">
            7 days • 50 command exercises
          </span>
        </div>

        <div className="space-y-3">
          {weeks
            .find((w) => w.week === selectedWeek)
            ?.days.map((day) => {
              const dayCompleted = day.lessons.every((l) =>
                progress.completedLessons.includes(l.id)
              );
              const dayCompletedCount = day.lessons.filter((l) =>
                progress.completedLessons.includes(l.id)
              ).length;
              const firstLesson = day.lessons[0];
              const unlocked = isUnlocked(firstLesson.id);

              return (
                <div
                  key={day.day}
                  className="p-4 rounded-lg bg-[#11141B] border border-[#272D39] hover:border-[#8B7CFF]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded bg-[#171B24] border border-[#272D39] flex items-center justify-center font-mono text-xs font-bold text-[#8B7CFF] shrink-0">
                      D{day.day}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#F4F6FA]">{day.title}</h4>
                        {dayCompleted && (
                          <span className="flex items-center gap-1 text-[11px] text-[#36D399] font-medium bg-[#36D399]/10 px-1.5 py-0.2 rounded border border-[#36D399]/30">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A0A8B8] mt-0.5">{day.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#A0A8B8]">
                        <span>{day.commandCount} units</span>
                        <span>•</span>
                        <span>{day.estimatedMinutes} mins</span>
                        <span>•</span>
                        <span className="font-mono text-[#8B7CFF]">
                          {day.lessons.map((l) => l.commandName).slice(0, 4).join(", ")}
                          {day.lessons.length > 4 ? "..." : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Progress */}
                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-medium text-[#F4F6FA]">
                        {dayCompletedCount}/{day.commandCount}
                      </div>
                      <div className="text-[10px] text-[#A0A8B8]">completed</div>
                    </div>

                    {unlocked ? (
                      <Link
                        href={`/lesson/${firstLesson.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171B24] hover:bg-[#8B7CFF] hover:text-[#0B0D12] text-[#F4F6FA] text-xs font-semibold rounded border border-[#272D39] transition-all"
                      >
                        <span>{dayCompleted ? "Review" : "Start"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B0D12] text-[#A0A8B8] text-xs font-medium rounded border border-[#272D39]/60 cursor-not-allowed">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
