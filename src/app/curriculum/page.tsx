"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ALL_LESSONS, getWeeks, WEEK_THEMES } from "@/data/curriculum";
import { useLearnerProgress } from "@/lib/storage/progress-store";
import {
  Compass,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  Play,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default function CurriculumPage() {
  const { progress, isUnlocked } = useLearnerProgress();
  const weeks = getWeeks();

  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_LESSONS.forEach((l) => set.add(l.category));
    return Array.from(set).sort();
  }, []);

  // Filter lessons
  const filteredWeeks = useMemo(() => {
    return weeks
      .filter((w) => selectedWeek === "all" || w.week === selectedWeek)
      .map((w) => {
        const days = w.days.map((d) => {
          const lessons = d.lessons.filter((l) => {
            const matchesQuery =
              l.commandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              l.explanation.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
              selectedCategory === "all" || l.category === selectedCategory;
            return matchesQuery && matchesCategory;
          });
          return { ...d, lessons };
        });
        return { ...w, days: days.filter((d) => d.lessons.length > 0) };
      })
      .filter((w) => w.days.length > 0);
  }, [weeks, selectedWeek, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171B24] border border-[#272D39] text-xs font-mono text-[#8B7CFF] mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Full 28-Day Track</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F6FA]">
          Complete 200-Command Curriculum
        </h1>
        <p className="text-sm text-[#A0A8B8] mt-1 max-w-2xl">
          Four structured weeks of practical Linux mastery. Filter by week, search for specific commands, or explore topics.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#11141B] border border-[#272D39] mb-8 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A0A8B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any Linux command, flag, or concept (e.g. grep, sed, chmod, awk, tar)..."
            className="w-full bg-[#090B10] text-[#F4F6FA] text-xs font-mono pl-9 pr-4 py-2.5 rounded-lg border border-[#272D39] focus:outline-none focus:border-[#8B7CFF]"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Week tabs */}
          <div className="flex items-center bg-[#171B24] border border-[#272D39] rounded p-0.5">
            <button
              onClick={() => setSelectedWeek("all")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedWeek === "all"
                  ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              All Weeks (200)
            </button>
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedWeek === w
                    ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                    : "text-[#A0A8B8] hover:text-[#F4F6FA]"
                }`}
              >
                Week {w}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#272D39] hidden sm:block" />

          {/* Category dropdown */}
          <div className="flex items-center gap-1.5 text-[#A0A8B8]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#171B24] text-[#F4F6FA] text-xs px-2.5 py-1 rounded border border-[#272D39] focus:outline-none focus:border-[#8B7CFF]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Curriculum Trees */}
      <div className="space-y-10">
        {filteredWeeks.map((week) => (
          <div key={week.week} className="space-y-4">
            {/* Week Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#272D39] gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#8B7CFF] bg-[#8B7CFF]/10 px-2 py-0.5 rounded border border-[#8B7CFF]/30">
                    WEEK {week.week}
                  </span>
                  <h2 className="text-xl font-bold text-[#F4F6FA]">{week.theme}</h2>
                </div>
                <p className="text-xs text-[#A0A8B8] mt-1">{week.description}</p>
              </div>
            </div>

            {/* Days in Week */}
            <div className="space-y-4">
              {week.days.map((day) => (
                <div
                  key={day.day}
                  className="rounded-lg bg-[#11141B] border border-[#272D39] p-5"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#272D39]/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded bg-[#171B24] border border-[#272D39] flex items-center justify-center font-mono text-xs font-bold text-[#8B7CFF]">
                        D{day.day}
                      </span>
                      <h3 className="text-sm font-bold text-[#F4F6FA]">{day.title}</h3>
                    </div>
                    <span className="text-xs text-[#A0A8B8]">
                      {day.lessons.length} commands • {day.estimatedMinutes} mins
                    </span>
                  </div>

                  {/* Commands Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {day.lessons.map((lesson) => {
                      const completed = progress.completedLessons.includes(lesson.id);
                      const unlocked = isUnlocked(lesson.id);

                      return (
                        <Link
                          key={lesson.id}
                          href={unlocked ? `/lesson/${lesson.id}` : "#"}
                          className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                            completed
                              ? "bg-[#171B24] border-[#36D399]/40 hover:border-[#36D399]"
                              : unlocked
                              ? "bg-[#171B24] border-[#272D39] hover:border-[#8B7CFF]"
                              : "bg-[#090B10] border-[#272D39]/40 opacity-60 cursor-not-allowed"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-xs font-bold text-[#8B7CFF]">
                                {lesson.commandName}
                              </span>
                              {completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#36D399]" />
                              ) : unlocked ? (
                                <span className="text-[10px] font-mono text-[#A0A8B8]">
                                  #{lesson.sequence}
                                </span>
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#A0A8B8]" />
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-[#F4F6FA] line-clamp-1">
                              {lesson.title}
                            </h4>
                            <p className="text-[11px] text-[#A0A8B8] line-clamp-2 mt-1">
                              {lesson.learningObjective}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#272D39]/50 flex items-center justify-between text-[10px] text-[#A0A8B8]">
                            <span>{lesson.estimatedMinutes}m</span>
                            <span className="font-mono">{lesson.category}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
