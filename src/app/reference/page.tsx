"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getAllCommandsReference } from "@/data/curriculum";
import {
  FileCode2,
  Search,
  Filter,
  Copy,
  ExternalLink,
  ShieldAlert,
  Cpu,
  Check,
  Globe,
} from "lucide-react";

export default function ReferencePage() {
  const allCommands = useMemo(() => getAllCommandsReference(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedText, setCopiedText] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    allCommands.forEach((c) => set.add(c.category));
    return Array.from(set).sort();
  }, [allCommands]);

  const filteredCommands = useMemo(() => {
    return allCommands.filter((cmd) => {
      const matchSearch =
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "all" || cmd.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [allCommands, searchQuery, selectedCategory]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171B24] border border-[#272D39] text-xs font-mono text-[#8B7CFF] mb-2">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>200 Commands Reference Index</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F6FA]">
          Linux Command Reference
        </h1>
        <p className="text-sm text-[#A0A8B8] mt-1 max-w-2xl">
          Search, inspect, and explore all 200 commands covered in Terminal Zero. Includes verified syntax, practical examples, and runtime compatibility notes.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-[#11141B] border border-[#272D39] mb-8 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A0A8B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands, syntax, or keywords (e.g. grep, sed, tar, curl, ssh)..."
            className="w-full bg-[#090B10] text-[#F4F6FA] text-xs font-mono pl-9 pr-4 py-2.5 rounded-lg border border-[#272D39] focus:outline-none focus:border-[#8B7CFF]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#A0A8B8]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#171B24] text-[#F4F6FA] text-xs px-3 py-1.5 rounded border border-[#272D39] focus:outline-none focus:border-[#8B7CFF]"
          >
            <option value="all">All Categories ({allCommands.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-[#A0A8B8] text-xs ml-auto">
            Showing {filteredCommands.length} of {allCommands.length} commands
          </span>
        </div>
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCommands.map((cmd) => (
          <div
            key={cmd.lessonId}
            className="p-5 rounded-lg bg-[#11141B] border border-[#272D39] hover:border-[#8B7CFF]/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-bold text-[#8B7CFF] bg-[#8B7CFF]/10 px-2 py-0.5 rounded border border-[#8B7CFF]/20">
                  {cmd.name}
                </span>
                <span className="text-[11px] font-mono text-[#A0A8B8]">
                  Week {cmd.week} • Day {cmd.day}
                </span>
              </div>

              <div className="text-xs font-mono text-[#A0A8B8] mb-2">{cmd.category}</div>
              <p className="text-xs text-[#F4F6FA] leading-relaxed mb-4 line-clamp-3">
                {cmd.description}
              </p>

              {/* Syntax box */}
              <div className="mb-4">
                <div className="text-[10px] text-[#A0A8B8] uppercase tracking-wider mb-1">
                  Syntax
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#090B10] border border-[#272D39] font-mono text-xs text-[#F4F6FA]">
                  <code className="truncate">{cmd.syntax}</code>
                  <button
                    onClick={() => copyToClipboard(cmd.syntax)}
                    className="text-[#A0A8B8] hover:text-[#8B7CFF] ml-2 shrink-0"
                    title="Copy syntax"
                  >
                    {copiedText === cmd.syntax ? (
                      <Check className="w-3.5 h-3.5 text-[#36D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Compatibility pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[10px]">
                {cmd.availability.browserRuntimeSupported && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#36D399]/10 text-[#36D399] border border-[#36D399]/20 font-mono">
                    <Cpu className="w-3 h-3" /> Wasm Supported
                  </span>
                )}
                {cmd.availability.requiresRoot && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F6C66A]/10 text-[#F6C66A] border border-[#F6C66A]/20 font-mono">
                    <ShieldAlert className="w-3 h-3" /> Root Privileges
                  </span>
                )}
                {cmd.availability.requiresNetwork && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#8B7CFF]/10 text-[#8B7CFF] border border-[#8B7CFF]/20 font-mono">
                    <Globe className="w-3 h-3" /> Network
                  </span>
                )}
              </div>
            </div>

            {/* Link to Lesson */}
            <div className="pt-3 border-t border-[#272D39] flex items-center justify-between">
              <span className="text-xs text-[#A0A8B8]">Interactive lesson</span>
              <Link
                href={`/lesson/${cmd.lessonId}`}
                className="inline-flex items-center gap-1 text-xs text-[#8B7CFF] hover:underline font-medium"
              >
                <span>Practice Command</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
