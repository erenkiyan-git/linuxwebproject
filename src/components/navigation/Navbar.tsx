"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLearnerProgress } from "@/lib/storage/progress-store";
import {
  Terminal,
  BookOpen,
  Compass,
  FileCode2,
  Flame,
  Settings,
  Menu,
  X,
  Award,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { overall, progress, mounted } = useLearnerProgress();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/curriculum", label: "Curriculum", icon: Compass },
    { href: "/reference", label: "Reference", icon: FileCode2 },
    { href: "/progress", label: "Progress", icon: Award },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0B0D12]/90 backdrop-blur-md border-b border-[#272D39]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-[#171B24] border border-[#272D39] flex items-center justify-center text-[#8B7CFF] group-hover:border-[#8B7CFF] transition-colors">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm tracking-wider text-[#F4F6FA]">
                TERMINAL<span className="text-[#8B7CFF]">ZERO</span>
              </span>
              <span className="px-1.5 py-0.2 bg-[#8B7CFF]/10 text-[#8B7CFF] text-[10px] font-mono rounded border border-[#8B7CFF]/30">
                v2026.1
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#171B24] text-[#8B7CFF] border border-[#272D39]"
                    : "text-[#A0A8B8] hover:text-[#F4F6FA] hover:bg-[#171B24]/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Stats & Learner Status */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Streak indicator */}
          <div
            title="Daily practice streak"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#171B24] border border-[#272D39] rounded text-xs text-[#F6C66A]"
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span className="font-mono font-semibold">{mounted ? progress.streak : 1}d</span>
          </div>

          {/* Progress pill */}
          <Link
            href="/progress"
            title="View overall curriculum progress"
            className="flex items-center gap-2 px-2.5 py-1 bg-[#171B24] border border-[#272D39] rounded text-xs text-[#A0A8B8] hover:border-[#8B7CFF] transition-colors"
          >
            <div className="w-16 h-1.5 bg-[#0B0D12] rounded-full overflow-hidden border border-[#272D39]">
              <div
                className="h-full bg-[#8B7CFF] transition-all duration-500 rounded-full"
                style={{ width: `${mounted ? overall.percentage : 0}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-[#F4F6FA]">
              {mounted ? overall.completedCount : 0}/200
            </span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md text-[#A0A8B8] hover:text-[#F4F6FA] bg-[#171B24] border border-[#272D39]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#272D39] bg-[#11141B] px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? "bg-[#171B24] text-[#8B7CFF] border border-[#272D39]"
                    : "text-[#A0A8B8] hover:text-[#F4F6FA] hover:bg-[#171B24]/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#272D39] flex items-center justify-between text-xs text-[#A0A8B8]">
            <span>Mastery: {mounted ? overall.completedCount : 0}/200 commands</span>
            <span className="text-[#F6C66A] flex items-center gap-1 font-mono">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {mounted ? progress.streak : 1} Day Streak
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
