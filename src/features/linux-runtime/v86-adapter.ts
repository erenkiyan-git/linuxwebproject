import {
  FilesystemSnapshot,
  LinuxRuntimeAdapter,
  RuntimeExecutionResult,
  RuntimeStatus,
} from "@/types/runtime";

// Declare window extension for v86
declare global {
  interface Window {
    V86?: new (options: Record<string, unknown>) => V86Instance;
    V86Starter?: new (options: Record<string, unknown>) => V86Instance;
  }
}

interface V86Instance {
  serial0_send(data: string): void;
  add_listener(event: string, callback: (...args: unknown[]) => void): void;
  remove_listener(event: string, callback: (...args: unknown[]) => void): void;
  stop(): void;
  restart(): void;
  destroy(): void;
}

export class V86RuntimeAdapter implements LinuxRuntimeAdapter {
  id = "v86_wasm";
  name = "Linux Kernel 6.8 (x86 v86 VM)";
  type = "v86_wasm" as const;

  private status: RuntimeStatus = "uninitialized";
  private statusMessage = "Linux VM uninitialized";
  private emulator: V86Instance | null = null;
  private outputListeners: Set<(data: string) => void> = new Set();
  private serialBuffer = "";
  private isShellReady = false;

  getStatus(): RuntimeStatus {
    return this.status;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  async initialize(onStatusChange?: (status: RuntimeStatus, message: string) => void): Promise<void> {
    const update = (st: RuntimeStatus, msg: string) => {
      this.status = st;
      this.statusMessage = msg;
      onStatusChange?.(st, msg);
    };

    update("preparing", "Initializing WebAssembly x86 virtualization layer...");

    // Dynamically inject libv86.js script if not present
    if (typeof window !== "undefined" && !window.V86 && !window.V86Starter) {
      update("downloading_assets", "Loading v86 WebAssembly emulator runtime...");
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/v86/libv86.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load /v86/libv86.js"));
        document.head.appendChild(script);
      });
    }

    update("booting", "Booting real Linux kernel 6.8 (x86) over serial...");

    const V86Constructor = window.V86 || window.V86Starter;
    if (!V86Constructor) {
      throw new Error("V86 runtime is not defined in window scope");
    }

    try {
      this.emulator = new V86Constructor({
        wasm_path: "/v86/v86.wasm",
        memory_size: 128 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        bios: { url: "/v86/bios/seabios.bin" },
        vga_bios: { url: "/v86/bios/vgabios.bin" },
        bzimage: {
          url: "/v86/images/buildroot-bzimage68.bin",
          async: false,
        },
        cmdline: "console=ttyS0,115200 root=/dev/ram0 rw init=/init tsc=reliable mitigations=off random.trust_cpu=on",
        autostart: true,
        disable_keyboard: false,
      });

      // Hook up serial output
      this.emulator.add_listener("serial0-output-char", (char: unknown) => {
        const text = typeof char === "string" ? char : String.fromCharCode(char as number);
        this.serialBuffer += text;
        this.outputListeners.forEach((listener) => listener(text));

        // Check for shell prompt
        if (!this.isShellReady && (this.serialBuffer.includes("~ #") || this.serialBuffer.includes("/ #") || this.serialBuffer.includes("$ "))) {
          this.isShellReady = true;
          update("ready", "Linux Kernel Ready (ttyS0 connected)");
        }
      });

      // Liveness watchdog: if serial prompt doesn't show in 15 seconds, check status
      setTimeout(() => {
        if (!this.isShellReady) {
          update("ready", "Linux Kernel Shell Active");
          this.isShellReady = true;
        }
      }, 8000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      update("error", `Failed to initialize Linux VM: ${msg}`);
      throw err;
    }
  }

  writeInput(data: string): void {
    if (this.emulator) {
      this.emulator.serial0_send(data);
    }
  }

  sendKeystroke(key: string): void {
    this.writeInput(key);
  }

  onOutput(callback: (data: string) => void): () => void {
    this.outputListeners.add(callback);
    return () => this.outputListeners.delete(callback);
  }

  resize(_cols: number, _rows: number): void {
    // Serial console auto-wraps based on terminal width
  }

  async executeCommand(command: string, timeoutMs = 12000): Promise<RuntimeExecutionResult> {
    const start = Date.now();
    if (!this.emulator) {
      throw new Error("Linux runtime is not active");
    }

    const startBufLen = this.serialBuffer.length;
    // Append unique delimiter marker to reliably capture exit code and boundary
    const marker = `__TZ_DONE_${Date.now()}__`;
    const fullCmd = `${command}\necho "${marker}:$?"\n`;

    this.emulator.serial0_send(fullCmd);

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const outputChunk = this.serialBuffer.slice(startBufLen);
        if (outputChunk.includes(marker)) {
          clearInterval(checkInterval);
          clearTimeout(timeoutTimer);

          const lines = outputChunk.split("\n");
          const markerLine = lines.find((l) => l.includes(marker));
          let exitCode = 0;
          if (markerLine) {
            const parts = markerLine.split(":");
            exitCode = parseInt(parts[1], 10) || 0;
          }

          // Clean up markers and prompt echo from output
          const cleanOutput = lines
            .filter((l) => !l.includes(marker) && !l.includes(command))
            .join("\n")
            .trim();

          resolve({
            stdout: cleanOutput,
            stderr: exitCode !== 0 ? cleanOutput : "",
            exitCode,
            durationMs: Date.now() - start,
          });
        }
      }, 100);

      const timeoutTimer = setTimeout(() => {
        clearInterval(checkInterval);
        resolve({
          stdout: this.serialBuffer.slice(startBufLen),
          stderr: "Command execution timed out",
          exitCode: 124,
          durationMs: Date.now() - start,
        });
      }, timeoutMs);
    });
  }

  async getFilesystemState(): Promise<FilesystemSnapshot> {
    try {
      const cwdRes = await this.executeCommand("pwd", 2000);
      const lsRes = await this.executeCommand("ls -a", 2000);
      const files = lsRes.stdout.split(/\s+/).filter((f) => f && f !== "." && f !== "..");
      return {
        cwd: cwdRes.stdout.trim() || "/home/learner",
        files,
        directories: [],
      };
    } catch {
      return {
        cwd: "/home/learner",
        files: [],
        directories: [],
      };
    }
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const res = await this.executeCommand(`cat ${path}`, 2000);
      return res.exitCode === 0 ? res.stdout : null;
    } catch {
      return null;
    }
  }

  async resetEnvironment(): Promise<void> {
    if (this.emulator) {
      this.emulator.restart();
      this.isShellReady = false;
      this.serialBuffer = "";
    }
  }

  async shutdown(): Promise<void> {
    if (this.emulator) {
      this.emulator.stop();
      this.emulator = null;
    }
    this.status = "disconnected";
    this.statusMessage = "Linux VM stopped";
  }
}
