"use client";

import React, { useState } from "react";
import { useLearnerProgress } from "@/lib/storage/progress-store";
import { runtimeManager } from "@/features/linux-runtime/runtime-manager";
import {
  Settings,
  Terminal,
  RotateCcw,
  Trash2,
  Shield,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function SettingsPage() {
  const { progress, updateSettings, resetAll, mounted } = useLearnerProgress();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [restartDone, setRestartDone] = useState(false);

  const settings = progress.settings;

  const handleResetProgress = () => {
    resetAll();
    setShowResetConfirm(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const handleRestartEnvironment = async () => {
    const adapter = runtimeManager.getActiveAdapter();
    await adapter.resetEnvironment();
    setRestartDone(true);
    setTimeout(() => setRestartDone(false), 3000);
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171B24] border border-[#272D39] text-xs font-mono text-[#8B7CFF] mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Application Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F4F6FA]">
          Terminal & Learning Preferences
        </h1>
        <p className="text-sm text-[#A0A8B8] mt-1">
          Customize terminal appearance, manage runtime environments, and manage your stored learning progress.
        </p>
      </div>

      <div className="space-y-6">
        {/* Terminal Appearance Settings */}
        <div className="p-6 rounded-xl bg-[#11141B] border border-[#272D39]">
          <h2 className="text-base font-bold text-[#F4F6FA] flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-[#8B7CFF]" />
            <span>Terminal Display</span>
          </h2>

          <div className="space-y-5">
            {/* Font Size */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#272D39]">
              <div>
                <div className="text-sm font-medium text-[#F4F6FA]">Terminal Font Size</div>
                <div className="text-xs text-[#A0A8B8]">
                  Adjust the monospaced text size in the terminal workspace.
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#171B24] border border-[#272D39] rounded p-1 text-xs">
                {[12, 14, 16, 18].map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ fontSize: size })}
                    className={`px-3 py-1 rounded transition-colors ${
                      settings.fontSize === size
                        ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                        : "text-[#A0A8B8] hover:text-[#F4F6FA]"
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#272D39]">
              <div>
                <div className="text-sm font-medium text-[#F4F6FA]">Font Family</div>
                <div className="text-xs text-[#A0A8B8]">
                  Select the monospaced typeface for code and terminal execution.
                </div>
              </div>
              <select
                value={settings.fontFamily}
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="bg-[#171B24] text-[#F4F6FA] text-xs px-3 py-1.5 rounded border border-[#272D39] focus:outline-none focus:border-[#8B7CFF]"
              >
                <option value="JetBrains Mono">JetBrains Mono (Recommended)</option>
                <option value="Menlo">Menlo / Monaco</option>
                <option value="monospace">System Monospace</option>
              </select>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between pb-4 border-b border-[#272D39]">
              <div>
                <div className="text-sm font-medium text-[#F4F6FA]">Reduced Motion</div>
                <div className="text-xs text-[#A0A8B8]">
                  Disable confetti animations and decorative micro-interactions.
                </div>
              </div>
              <button
                onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.reducedMotion ? "bg-[#8B7CFF]" : "bg-[#272D39]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.reducedMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Cursor Blink */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#F4F6FA]">Cursor Blink</div>
                <div className="text-xs text-[#A0A8B8]">
                  Enable or disable standard terminal cursor blinking.
                </div>
              </div>
              <button
                onClick={() => updateSettings({ cursorBlink: !settings.cursorBlink })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.cursorBlink ? "bg-[#8B7CFF]" : "bg-[#272D39]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.cursorBlink ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Runtime Environment Management */}
        <div className="p-6 rounded-xl bg-[#11141B] border border-[#272D39]">
          <h2 className="text-base font-bold text-[#F4F6FA] flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-[#36D399]" />
            <span>Linux Virtual Machine Management</span>
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#171B24] border border-[#272D39] text-xs space-y-2">
              <div className="font-semibold text-[#F4F6FA]">Runtime Status & Specs</div>
              <div className="text-[#A0A8B8] grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>Primary Engine: v86 x86 Linux VM (Wasm)</div>
                <div>Fallback Engine: POSIX Sandbox Engine</div>
                <div>Kernel: Linux 6.8 (Buildroot / BusyBox)</div>
                <div>Architecture: 32-bit x86 emulated via Wasm</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <div className="text-sm font-medium text-[#F4F6FA]">Reset Linux Filesystem</div>
                <div className="text-xs text-[#A0A8B8]">
                  Restore the virtual root filesystem and reset working files back to initial state.
                </div>
              </div>
              <button
                onClick={handleRestartEnvironment}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#171B24] hover:bg-[#272D39] text-[#F4F6FA] text-xs font-semibold rounded border border-[#272D39] transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Environment</span>
              </button>
            </div>
            {restartDone && (
              <div className="text-xs text-[#36D399] flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Environment reset successfully.</span>
              </div>
            )}
          </div>
        </div>

        {/* Destructive: Reset Progress */}
        <div className="p-6 rounded-xl bg-[#11141B] border border-[#FB7185]/30">
          <h2 className="text-base font-bold text-[#FB7185] flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#FB7185]" />
            <span>Danger Zone</span>
          </h2>
          <p className="text-xs text-[#A0A8B8] mb-4">
            Reset all completed lessons, challenges, and daily streak back to day 1. This action cannot be undone.
          </p>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FB7185]/10 hover:bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 text-xs font-semibold rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Learning Progress</span>
            </button>
          ) : (
            <div className="p-4 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/40 text-xs space-y-3">
              <div className="font-semibold text-[#FB7185]">
                Are you sure you want to erase all learning progress?
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetProgress}
                  className="px-3.5 py-1.5 bg-[#FB7185] text-[#0B0D12] font-bold rounded hover:bg-[#FDA4AF] transition-colors"
                >
                  Yes, Erase Everything
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3.5 py-1.5 bg-[#171B24] text-[#F4F6FA] rounded border border-[#272D39] hover:bg-[#272D39]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {resetDone && (
            <div className="mt-3 text-xs text-[#36D399] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Learning progress has been reset.</span>
            </div>
          )}
        </div>

        {/* Local Storage Profile Isolation & Architecture Notice */}
        <div className="p-5 rounded-xl bg-[#11141B] border border-[#272D39] flex items-start gap-3 text-xs text-[#A0A8B8]">
          <Shield className="w-4 h-4 text-[#36D399] shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <div>
              <span className="font-semibold text-[#F4F6FA]">Browser Profile Isolation: </span>
              Terminal Zero persists your curriculum progress locally in your browser&apos;s LocalStorage under <code className="text-[#8B7CFF] font-mono">terminal-zero:progress:v1</code>.
            </div>
            <div className="text-[#A0A8B8]">
              <strong>Storage Limitations:</strong> Progress is tied to this specific browser origin and profile. It is not an online cloud account or database: clearing website cookies/data, using private/incognito browsing, or switching devices/profiles will not transfer your progress. Local Linux files created during exercises reset with runtime restarts and are kept strictly isolated from course progress.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
