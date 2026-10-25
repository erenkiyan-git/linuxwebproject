"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal as TerminalIcon,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Award,
  Zap,
} from "lucide-react";
import { WEEK_THEMES } from "@/data/curriculum";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"pwd" | "ls" | "grep">("pwd");

  const previews = {
    pwd: {
      input: "pwd",
      output: "/home/learner",
      desc: "Prints the absolute path of your current working directory.",
    },
    ls: {
      input: "ls -la",
      output: `total 16
drwxr-xr-x 2 learner learner 4096 Oct 25 01:24 .
drwxr-xr-x 3 root    root    4096 Oct 25 01:24 ..
-rw-r--r-- 1 learner learner  220 Oct 25 01:24 .bashrc
-rw-r--r-- 1 learner learner   68 Oct 25 01:24 welcome.txt`,
      desc: "Lists non-hidden and hidden files with permissions and owners.",
    },
    grep: {
      input: "grep -i 'root' /etc/passwd",
      output: "root:x:0:0:root:/root:/bin/sh",
      desc: "Finds lines matching patterns with regular expressions.",
    },
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#272D39]">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#8B7CFF]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171B24] border border-[#272D39] text-xs font-mono text-[#8B7CFF] mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master 200 Linux commands in 28 days</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F4F6FA] max-w-4xl leading-[1.15]">
            Linux Skills. Built One Command at a Time.
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-[#A0A8B8] max-w-2xl leading-relaxed">
            Learn 200 essential Linux commands in 28 structured days. Practice in a real Linux
            environment running directly in your browser.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] font-semibold text-sm transition-all shadow-lg shadow-[#8B7CFF]/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Learning</span>
            </Link>
            <Link
              href="/curriculum"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#171B24] hover:bg-[#272D39] text-[#F4F6FA] border border-[#272D39] font-medium text-sm transition-all"
            >
              <span>Explore Curriculum</span>
              <ArrowRight className="w-4 h-4 text-[#A0A8B8]" />
            </Link>
          </div>

          {/* LIVE TERMINAL PREVIEW */}
          <div className="mt-14 w-full max-w-3xl rounded-lg bg-[#090B10] border border-[#272D39] shadow-2xl overflow-hidden text-left">
            {/* Window bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#11141B] border-b border-[#272D39]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FB7185]" />
                <span className="w-3 h-3 rounded-full bg-[#F6C66A]" />
                <span className="w-3 h-3 rounded-full bg-[#36D399]" />
                <span className="ml-2 text-xs font-mono text-[#A0A8B8]">terminal-zero: bash preview</span>
              </div>
              <div className="flex items-center gap-1">
                {(["pwd", "ls", "grep"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      activeTab === tab
                        ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                        : "text-[#A0A8B8] hover:text-[#F4F6FA]"
                    }`}
                  >
                    ${tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 font-mono text-xs sm:text-sm text-[#F4F6FA] min-h-[160px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#36D399]">
                  <span className="text-[#A0A8B8]">learner@terminalzero:~$</span>
                  <span className="text-[#F4F6FA]">{previews[activeTab].input}</span>
                </div>
                <pre className="mt-2 text-[#A0A8B8] font-mono whitespace-pre-wrap">
                  {previews[activeTab].output}
                </pre>
              </div>
              <div className="mt-4 pt-3 border-t border-[#272D39]/60 flex items-center justify-between text-xs text-[#A0A8B8]">
                <span>{previews[activeTab].desc}</span>
                <span className="text-[#36D399] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Real Shell Output
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto w-full border-b border-[#272D39]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F6FA]">
            How Hands-On Learning Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#A0A8B8]">
            No slides, no multiple-choice trivia. You learn Linux the only way that sticks: by executing commands in a real shell.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Learn the Concept",
              desc: "Read a crisp, beginner-friendly explanation with syntax and practical real-world examples.",
              icon: BookOpen,
            },
            {
              step: "02",
              title: "Execute in Terminal",
              desc: "Run commands inside a real in-browser Linux shell powered by WebAssembly.",
              icon: TerminalIcon,
            },
            {
              step: "03",
              title: "Complete Challenge",
              desc: "Solve a guided challenge and receive instant automated verification feedback.",
              icon: Zap,
            },
            {
              step: "04",
              title: "Track & Unlock",
              desc: "Unlock subsequent lessons, build your daily streak, and master 200 commands in 28 days.",
              icon: Award,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-lg bg-[#11141B] border border-[#272D39] flex flex-col justify-between hover:border-[#8B7CFF]/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#8B7CFF] bg-[#8B7CFF]/10 px-2 py-0.5 rounded border border-[#8B7CFF]/30">
                      STEP {item.step}
                    </span>
                    <Icon className="w-4 h-4 text-[#A0A8B8] group-hover:text-[#8B7CFF] transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-[#F4F6FA] mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#A0A8B8] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4-WEEK ROADMAP OVERVIEW */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto w-full border-b border-[#272D39]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F6FA]">
              The 4-Week Mastery Curriculum
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#A0A8B8]">
              50 commands per week. 28 daily modules. 200 total practical learning units.
            </p>
          </div>
          <Link
            href="/curriculum"
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B7CFF] hover:underline"
          >
            <span>View Full Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((weekNum) => {
            const info = WEEK_THEMES[weekNum];
            return (
              <div
                key={weekNum}
                className="p-6 rounded-lg bg-[#11141B] border border-[#272D39] flex flex-col justify-between hover:border-[#8B7CFF]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-[#8B7CFF]">
                      WEEK {weekNum}
                    </span>
                    <span className="font-mono text-xs text-[#A0A8B8]">50 Commands • 7 Days</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#F4F6FA] mb-2">{info.theme}</h3>
                  <p className="text-xs sm:text-sm text-[#A0A8B8] leading-relaxed mb-4">
                    {info.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#272D39] flex items-center justify-between text-xs">
                  <span className="text-[#A0A8B8]">Days {(weekNum - 1) * 7 + 1} to {weekNum * 7}</span>
                  <Link
                    href={`/curriculum?week=${weekNum}`}
                    className="text-[#8B7CFF] hover:underline font-medium"
                  >
                    Inspect Week {weekNum} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RUNTIME ARCHITECTURE & TRUST */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <div className="p-8 rounded-xl bg-[#11141B] border border-[#272D39] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#36D399]/10 text-[#36D399] border border-[#36D399]/30 text-xs font-mono mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Client-Side WebAssembly</span>
            </div>
            <h3 className="text-2xl font-bold text-[#F4F6FA] mb-3">
              Real In-Browser Linux Execution
            </h3>
            <p className="text-sm text-[#A0A8B8] leading-relaxed">
              Terminal Zero does not simulate command output with fake strings or execute commands on a remote server.
              Your shell runs directly inside your web browser via WebAssembly, providing an authentic, private, and instant environment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="p-4 rounded-lg bg-[#171B24] border border-[#272D39] flex items-center gap-3">
              <Cpu className="w-8 h-8 text-[#8B7CFF]" />
              <div>
                <div className="text-xs font-bold text-[#F4F6FA]">v86 x86 VM Engine</div>
                <div className="text-[11px] text-[#A0A8B8]">Linux 6.8 kernel in Wasm</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[#171B24] border border-[#272D39] flex items-center gap-3">
              <Layers className="w-8 h-8 text-[#36D399]" />
              <div>
                <div className="text-xs font-bold text-[#F4F6FA]">POSIX Sandbox</div>
                <div className="text-[11px] text-[#A0A8B8]">Instant zero-network shell</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 text-center border-t border-[#272D39] bg-[#090B10]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[#F4F6FA]">
            Ready to master the Linux terminal?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#A0A8B8]">
            Begin Day 1 with the fundamentals: print your working directory, navigate files, and inspect your environment.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] font-bold text-sm transition-all shadow-xl shadow-[#8B7CFF]/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Day 1 Lesson Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function BookOpen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
