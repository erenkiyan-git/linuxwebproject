"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { LinuxRuntimeAdapter, RuntimeExecutionResult, RuntimeStatus } from "@/types/runtime";
import { runtimeManager } from "@/features/linux-runtime/runtime-manager";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
} from "lucide-react";

interface TerminalWorkspaceProps {
  onCommandExecuted?: (cmd: string, result: RuntimeExecutionResult) => void;
  recommendedCommand?: string;
  initialDirectory?: string;
}

export function TerminalWorkspace({
  onCommandExecuted,
  recommendedCommand,
}: TerminalWorkspaceProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const runtimeRef = useRef<LinuxRuntimeAdapter | null>(null);

  const [status, setStatus] = useState<RuntimeStatus>("uninitialized");
  const [statusMessage, setStatusMessage] = useState<string>("Initializing Linux environment...");
  const [inputBuffer, setInputBuffer] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeEngine, setActiveEngine] = useState<"posix" | "v86">("posix");

  // Initialize terminal and runtime
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create xterm.js instance
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.25,
      theme: {
        background: "#090B10",
        foreground: "#F4F6FA",
        cursor: "#8B7CFF",
        cursorAccent: "#090B10",
        selectionBackground: "rgba(139, 124, 255, 0.3)",
        black: "#090B10",
        red: "#FB7185",
        green: "#36D399",
        yellow: "#F6C66A",
        blue: "#8B7CFF",
        magenta: "#C084FC",
        cyan: "#38BDF8",
        white: "#F4F6FA",
        brightBlack: "#272D39",
        brightRed: "#FDA4AF",
        brightGreen: "#6EE7B7",
        brightYellow: "#FDE68A",
        brightBlue: "#A5B4FC",
        brightMagenta: "#E9D5FF",
        brightCyan: "#7DD3FC",
        brightWhite: "#FFFFFF",
      },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Get runtime adapter
    const adapter = runtimeManager.getActiveAdapter();
    runtimeRef.current = adapter;
    setActiveEngine(adapter.type === "v86_wasm" ? "v86" : "posix");

    // Hook output listener
    const unsubscribeOutput = adapter.onOutput((data) => {
      term.write(data);
    });

    // Initialize adapter
    adapter
      .initialize((newStatus, message) => {
        setStatus(newStatus);
        setStatusMessage(message);
      })
      .catch((err) => {
        setStatus("error");
        setStatusMessage(`Initialization failed: ${err.message}`);
        term.write(`\r\n\x1b[31mError initializing runtime: ${err.message}\x1b[0m\r\n`);
      });

    // Handle terminal user key input
    let currentLine = "";
    term.onData((data) => {
      // Enter key
      if (data === "\r") {
        term.write("\r\n");
        const cmdToRun = currentLine.trim();
        currentLine = "";
        if (cmdToRun) {
          executeCommandString(cmdToRun);
        } else {
          // Empty newline prompt
          adapter.writeInput("\r");
        }
      } else if (data === "\u007F") {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write("\b \b");
        }
      } else if (data === "\u0003") {
        // Ctrl+C
        currentLine = "";
        term.write("^C\r\n");
        adapter.writeInput("^C\r\n");
      } else if (data.charCodeAt(0) >= 32) {
        currentLine += data;
        term.write(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      adapter.resize(term.cols, term.rows);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      unsubscribeOutput();
      term.dispose();
    };
  }, []);

  const executeCommandString = useCallback(
    async (cmd: string) => {
      if (!runtimeRef.current || isRunning) return;
      setIsRunning(true);
      try {
        const result = await runtimeRef.current.executeCommand(cmd);

        if (result.stdout) {
          const formatted = result.stdout.replace(/\n/g, "\r\n");
          xtermInstance.current?.write(formatted + "\r\n");
        }
        if (result.stderr) {
          const formatted = result.stderr.replace(/\n/g, "\r\n");
          xtermInstance.current?.write(`\x1b[31m${formatted}\x1b[0m\r\n`);
        }

        // Send callback for challenge evaluation
        onCommandExecuted?.(cmd, result);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        xtermInstance.current?.write(`\x1b[31mExecution error: ${errorMsg}\x1b[0m\r\n`);
      } finally {
        setIsRunning(false);
        // reprint prompt
        if (runtimeRef.current?.type === "posix_wasm") {
          const snapshot = await runtimeRef.current.getFilesystemState();
          xtermInstance.current?.write(`\x1b[1;32mlearner@terminalzero\x1b[0m:\x1b[1;34m${snapshot.cwd}\x1b[0m$ `);
        }
      }
    },
    [isRunning, onCommandExecuted]
  );

  const handleRunRecommended = () => {
    if (!recommendedCommand) return;
    xtermInstance.current?.write(`${recommendedCommand}\r\n`);
    executeCommandString(recommendedCommand);
  };

  const handleClearTerminal = () => {
    xtermInstance.current?.clear();
    executeCommandString("clear");
  };

  const handleRestart = async () => {
    if (!runtimeRef.current) return;
    setStatus("booting");
    setStatusMessage("Restarting Linux environment...");
    await runtimeRef.current.resetEnvironment();
    xtermInstance.current?.clear();
    xtermInstance.current?.write("\x1b[33mEnvironment reset successfully.\x1b[0m\r\n");
    setStatus("ready");
    setStatusMessage("Linux Environment Ready");
    if (runtimeRef.current.type === "posix_wasm") {
      xtermInstance.current?.write("\x1b[1;32mlearner@terminalzero\x1b[0m:\x1b[1;34m/home/learner\x1b[0m$ ");
    }
  };

  const handleToggleEngine = async (engine: "posix" | "v86") => {
    setActiveEngine(engine);
    setStatus("preparing");
    setStatusMessage(`Switching to ${engine === "v86" ? "v86 Linux x86 VM" : "POSIX Sandbox"}...`);
    xtermInstance.current?.clear();
    xtermInstance.current?.write(`\x1b[35mSwitching runtime engine to: ${engine}...\x1b[0m\r\n`);

    const newAdapter = await runtimeManager.switchAdapter(engine);
    runtimeRef.current = newAdapter;

    newAdapter.onOutput((data) => {
      xtermInstance.current?.write(data);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#090B10] border border-[#272D39] rounded-lg overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#11141B] border-b border-[#272D39] text-xs">
        {/* Left: Window Dots & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FB7185]/80 hover:bg-[#FB7185] transition-colors" />
            <span className="w-3 h-3 rounded-full bg-[#F6C66A]/80 hover:bg-[#F6C66A] transition-colors" />
            <span className="w-3 h-3 rounded-full bg-[#36D399]/80 hover:bg-[#36D399] transition-colors" />
          </div>

          <div className="h-4 w-[1px] bg-[#272D39]" />

          {/* Runtime Status Badge */}
          <div className="flex items-center gap-1.5">
            {status === "ready" ? (
              <span className="flex items-center gap-1 text-[#36D399] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready</span>
              </span>
            ) : status === "error" ? (
              <span className="flex items-center gap-1 text-[#FB7185] font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Runtime Error</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#F6C66A] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#F6C66A] animate-ping" />
                <span>{statusMessage}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Runtime Engine Selector & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Engine Selector */}
          <div className="flex items-center bg-[#171B24] border border-[#272D39] rounded p-0.5 text-[11px]">
            <button
              onClick={() => handleToggleEngine("posix")}
              title="Fast in-browser POSIX sandbox engine"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                activeEngine === "posix"
                  ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>POSIX</span>
            </button>
            <button
              onClick={() => handleToggleEngine("v86")}
              title="Full x86 Linux kernel running via WebAssembly"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                activeEngine === "v86"
                  ? "bg-[#8B7CFF] text-[#0B0D12] font-semibold"
                  : "text-[#A0A8B8] hover:text-[#F4F6FA]"
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>v86 Linux</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#272D39]" />

          {/* Action buttons */}
          <button
            onClick={handleClearTerminal}
            title="Clear terminal screen (Ctrl+L)"
            className="p-1.5 text-[#A0A8B8] hover:text-[#F4F6FA] hover:bg-[#171B24] rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRestart}
            title="Restart Linux runtime"
            className="p-1.5 text-[#A0A8B8] hover:text-[#F4F6FA] hover:bg-[#171B24] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recommended Quick Run Banner */}
      {recommendedCommand && (
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#171B24] border-b border-[#272D39] text-xs">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-[#A0A8B8]">Suggested:</span>
            <code className="text-[#8B7CFF] font-mono bg-[#090B10] px-1.5 py-0.5 rounded border border-[#272D39]">
              {recommendedCommand}
            </code>
          </div>
          <button
            onClick={handleRunRecommended}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#8B7CFF] hover:bg-[#9E91FF] text-[#0B0D12] text-xs font-semibold rounded transition-all disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>
        </div>
      )}

      {/* Actual xterm viewport */}
      <div className="flex-1 w-full h-full relative p-2 min-h-[300px]">
        <div ref={terminalRef} className="w-full h-full" />
      </div>

      {/* Manual Input Fallback Bar for accessibility & touch devices */}
      <div className="flex items-center gap-2 p-2 bg-[#11141B] border-t border-[#272D39]">
        <div className="flex items-center gap-1 text-[#A0A8B8] font-mono text-xs pl-1">
          <TerminalIcon className="w-3.5 h-3.5 text-[#8B7CFF]" />
          <span>$</span>
        </div>
        <input
          type="text"
          value={inputBuffer}
          onChange={(e) => setInputBuffer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputBuffer.trim()) {
              xtermInstance.current?.write(`${inputBuffer}\r\n`);
              executeCommandString(inputBuffer);
              setInputBuffer("");
            }
          }}
          placeholder="Type command and press Enter (or use terminal above)..."
          className="flex-1 bg-[#090B10] text-[#F4F6FA] text-xs font-mono px-3 py-1.5 rounded border border-[#272D39] focus:outline-none focus:border-[#8B7CFF]"
        />
        <button
          onClick={() => {
            if (inputBuffer.trim()) {
              xtermInstance.current?.write(`${inputBuffer}\r\n`);
              executeCommandString(inputBuffer);
              setInputBuffer("");
            }
          }}
          disabled={!inputBuffer.trim() || isRunning}
          className="px-3 py-1.5 bg-[#171B24] hover:bg-[#272D39] text-[#F4F6FA] text-xs font-mono rounded border border-[#272D39] disabled:opacity-40 transition-colors"
        >
          Execute
        </button>
      </div>
    </div>
  );
}
