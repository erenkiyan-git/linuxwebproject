import {
  FilesystemSnapshot,
  LinuxRuntimeAdapter,
  RuntimeExecutionResult,
  RuntimeStatus,
} from "@/types/runtime";

interface FileNode {
  type: "file" | "dir" | "symlink";
  content?: string;
  target?: string;
  mode: number; // e.g. 0o755
  owner: string;
  group: string;
  size: number;
  mtime: Date;
  inode: number;
}

export class PosixSandboxAdapter implements LinuxRuntimeAdapter {
  id = "posix_wasm";
  name = "POSIX In-Browser Shell Engine";
  type = "posix_wasm" as const;

  private status: RuntimeStatus = "uninitialized";
  private statusMessage = "Sandbox uninitialized";
  private cwd = "/home/learner";
  private fs: Map<string, FileNode> = new Map();
  private env: Map<string, string> = new Map();
  private outputListeners: Set<(data: string) => void> = new Set();
  private history: string[] = [];
  private lastExitCode = 0;
  private nextInode = 1001;

  constructor() {
    this.initDefaultFilesystem();
    this.initDefaultEnv();
  }

  getStatus(): RuntimeStatus {
    return this.status;
  }

  getStatusMessage(): string {
    return this.statusMessage;
  }

  private initDefaultEnv() {
    this.env.set("USER", "learner");
    this.env.set("HOME", "/home/learner");
    this.env.set("SHELL", "/bin/sh");
    this.env.set("TERM", "xterm-256color");
    this.env.set("PATH", "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
    this.env.set("PWD", "/home/learner");
    this.env.set("HOSTNAME", "terminalzero");
    this.env.set("LANG", "en_US.UTF-8");
  }

  private initDefaultFilesystem() {
    this.fs.clear();

    const makeDir = (path: string, mode = 0o755) => {
      this.fs.set(path, {
        type: "dir",
        mode,
        owner: "root",
        group: "root",
        size: 4096,
        mtime: new Date(),
        inode: this.nextInode++,
      });
    };

    const makeFile = (path: string, content: string, mode = 0o644, owner = "root") => {
      this.fs.set(path, {
        type: "file",
        content,
        mode,
        owner,
        group: "root",
        size: content.length,
        mtime: new Date(),
        inode: this.nextInode++,
      });
    };

    // Essential root tree
    ["/", "/bin", "/sbin", "/usr", "/usr/bin", "/etc", "/etc/init.d", "/home", "/home/learner", "/tmp", "/var", "/var/log", "/proc", "/sys"].forEach((d) =>
      makeDir(d)
    );

    // /etc files
    makeFile(
      "/etc/os-release",
      `NAME="Terminal Zero Linux"
VERSION="2026.1"
ID=terminalzero
ID_LIKE=alpine
PRETTY_NAME="Terminal Zero Linux (Alpine-based)"
HOME_URL="https://terminalzero.dev/"\n`
    );

    makeFile(
      "/etc/passwd",
      `root:x:0:0:root:/root:/bin/sh
daemon:x:1:1:daemon:/usr/sbin:/bin/false
bin:x:2:2:bin:/bin:/bin/false
sys:x:3:3:sys:/dev:/bin/false
learner:x:1000:1000:Linux Learner:/home/learner:/bin/sh\n`
    );

    makeFile("/etc/hosts", "127.0.0.1\tlocalhost\n127.0.1.1\tterminalzero\n::1\tlocalhost ip6-localhost ip6-loopback\n");
    makeFile("/etc/resolv.conf", "nameserver 1.1.1.1\nnameserver 8.8.8.8\nsearch localdomain\n");
    makeFile("/etc/hostname", "terminalzero\n");
    makeFile("/etc/services", "ssh\t\t22/tcp\nhttp\t\t80/tcp\nhttps\t\t443/tcp\ndomain\t\t53/udp\n");

    // /proc pseudo-files
    makeFile(
      "/proc/meminfo",
      `MemTotal:        1048576 kB
MemFree:          612340 kB
MemAvailable:     820492 kB
Buffers:           32410 kB
Cached:           214320 kB
SwapTotal:             0 kB
SwapFree:              0 kB\n`
    );

    makeFile(
      "/proc/cpuinfo",
      `processor\t: 0
vendor_id\t: GenuineIntel
cpu family\t: 6
model name\t: WebAssembly Virtual Core v86
cpu MHz\t\t: 2800.000
cache size\t: 4096 KB\n`
    );

    makeFile(
      "/proc/partitions",
      `major minor  #blocks  name

   8        0   10485760 sda
   8        1   10484736 sda1\n`
    );

    makeFile(
      "/proc/mounts",
      `/dev/sda1 / ext4 rw,relatime 0 0
proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
sysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0
tmpfs /tmp tmpfs rw,nosuid,nodev,relatime 0 0\n`
    );

    // /var/log files
    makeFile("/var/log/messages", "Oct 25 00:00:01 terminalzero syslogd: restart\nOct 25 00:00:05 terminalzero kernel: Linux version 6.8.0\n");

    // User starter files in /home/learner
    makeFile("/home/learner/welcome.txt", "Welcome to Terminal Zero!\nPractice Linux commands in this browser sandbox.\n", 0o644, "learner");
  }

  async initialize(onStatusChange?: (status: RuntimeStatus, message: string) => void): Promise<void> {
    this.status = "preparing";
    this.statusMessage = "Preparing in-browser sandbox environment...";
    onStatusChange?.(this.status, this.statusMessage);

    await new Promise((r) => setTimeout(r, 120));

    this.status = "booting";
    this.statusMessage = "Mounting virtual root filesystem...";
    onStatusChange?.(this.status, this.statusMessage);

    await new Promise((r) => setTimeout(r, 150));

    this.status = "connecting_shell";
    this.statusMessage = "Spawning POSIX shell session...";
    onStatusChange?.(this.status, this.statusMessage);

    await new Promise((r) => setTimeout(r, 80));

    this.status = "ready";
    this.statusMessage = "POSIX Shell Ready";
    onStatusChange?.(this.status, this.statusMessage);

    this.broadcastOutput("\x1b[1;36mTerminal Zero\x1b[0m — In-Browser Linux Sandbox Environment\r\nType \x1b[1;32mpwd\x1b[0m, \x1b[1;32mls\x1b[0m, or explore the current lesson challenge.\r\n\r\n");
    this.prompt();
  }

  private broadcastOutput(text: string) {
    this.outputListeners.forEach((l) => l(text));
  }

  private prompt() {
    this.broadcastOutput(`\x1b[1;32mlearner@terminalzero\x1b[0m:\x1b[1;34m${this.cwd}\x1b[0m$ `);
  }

  writeInput(data: string): void {
    // When user types in xterm, handle echo and carriage returns
    if (data === "\r") {
      this.broadcastOutput("\r\n");
      // execute current buffer if any
      this.prompt();
    } else {
      this.broadcastOutput(data);
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
    // virtual resize
  }

  private resolvePath(target: string): string {
    if (!target) return this.cwd;
    if (target === "~" || target.startsWith("~/")) {
      target = "/home/learner" + target.slice(1);
    }
    if (!target.startsWith("/")) {
      target = this.cwd === "/" ? `/${target}` : `${this.cwd}/${target}`;
    }
    // normalize . and ..
    const parts = target.split("/").filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return "/" + resolved.join("/");
  }

  async executeCommand(commandStr: string, _timeoutMs = 15000): Promise<RuntimeExecutionResult> {
    const start = Date.now();
    const trimmed = commandStr.trim();
    this.history.push(trimmed);

    if (!trimmed) {
      return { stdout: "", stderr: "", exitCode: 0, durationMs: 0 };
    }

    // Check for comments or chained commands with && or ;
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    // Split pipeline or sequence if contains pipes or redirects
    try {
      const res = this.runCommandInternal(trimmed);
      stdout = res.stdout;
      stderr = res.stderr;
      exitCode = res.exitCode;
      this.lastExitCode = exitCode;
    } catch (err: unknown) {
      stderr = err instanceof Error ? err.message : String(err);
      exitCode = 1;
      this.lastExitCode = 1;
    }

    const durationMs = Date.now() - start;
    return { stdout, stderr, exitCode, durationMs };
  }

  private runCommandInternal(cmd: string): { stdout: string; stderr: string; exitCode: number } {
    // Handle comments
    if (cmd.startsWith("#")) {
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    // Handle compound commands with && or ;
    if (cmd.includes("&&")) {
      const parts = cmd.split("&&");
      let aggregatedStdout = "";
      for (const part of parts) {
        const sub = this.runCommandInternal(part.trim());
        if (sub.stdout) aggregatedStdout += sub.stdout + (sub.stdout.endsWith("\n") ? "" : "\n");
        if (sub.exitCode !== 0) {
          return { stdout: aggregatedStdout.trimEnd(), stderr: sub.stderr, exitCode: sub.exitCode };
        }
      }
      return { stdout: aggregatedStdout.trimEnd(), stderr: "", exitCode: 0 };
    }

    if (cmd.includes(";")) {
      const parts = cmd.split(";");
      let aggregatedStdout = "";
      let lastExit = 0;
      let lastErr = "";
      for (const part of parts) {
        if (!part.trim()) continue;
        const sub = this.runCommandInternal(part.trim());
        if (sub.stdout) aggregatedStdout += sub.stdout + (sub.stdout.endsWith("\n") ? "" : "\n");
        lastExit = sub.exitCode;
        if (sub.stderr) lastErr = sub.stderr;
      }
      return { stdout: aggregatedStdout.trimEnd(), stderr: lastErr, exitCode: lastExit };
    }

    // Handle redirection (e.g. echo hello > file.txt or >> file.txt)
    if (cmd.includes(">>")) {
      const [left, right] = cmd.split(">>");
      const sub = this.runCommandInternal(left.trim());
      const targetFile = this.resolvePath(right.trim());
      const existing = this.fs.get(targetFile)?.content || "";
      this.fs.set(targetFile, {
        type: "file",
        content: existing + (existing.length && !existing.endsWith("\n") ? "\n" : "") + sub.stdout,
        mode: 0o644,
        owner: "learner",
        group: "learner",
        size: existing.length + sub.stdout.length,
        mtime: new Date(),
        inode: this.nextInode++,
      });
      return { stdout: "", stderr: sub.stderr, exitCode: sub.exitCode };
    }

    if (cmd.includes(">") && !cmd.includes("2>")) {
      const [left, right] = cmd.split(">");
      const sub = this.runCommandInternal(left.trim());
      const targetFile = this.resolvePath(right.trim());
      this.fs.set(targetFile, {
        type: "file",
        content: sub.stdout,
        mode: 0o644,
        owner: "learner",
        group: "learner",
        size: sub.stdout.length,
        mtime: new Date(),
        inode: this.nextInode++,
      });
      return { stdout: "", stderr: sub.stderr, exitCode: sub.exitCode };
    }

    // Handle pipes: cmd1 | cmd2
    if (cmd.includes("|")) {
      const stages = cmd.split("|").map((s) => s.trim());
      let pipeInput = "";
      for (const stage of stages) {
        const stageRes = this.runSingleCommandWithInput(stage, pipeInput);
        if (stageRes.exitCode !== 0 && stageRes.stderr) {
          return stageRes;
        }
        pipeInput = stageRes.stdout;
      }
      return { stdout: pipeInput, stderr: "", exitCode: 0 };
    }

    return this.runSingleCommandWithInput(cmd, "");
  }

  private runSingleCommandWithInput(
    commandStr: string,
    pipeIn: string
  ): { stdout: string; stderr: string; exitCode: number } {
    // Parse tokens respecting single and double quotes
    const tokens: string[] = [];
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    let match;
    while ((match = regex.exec(commandStr)) !== null) {
      if (match[2] !== undefined) {
        // Single quoted string: preserve literal text without variable expansion
        tokens.push(match[2]);
      } else {
        // Double-quoted or unquoted: perform parameter expansion ($VAR, $?, $$, $!)
        const raw = match[1] !== undefined ? match[1] : match[0];
        const expanded = raw.replace(/\$([a-zA-Z0-9_?]+|\!|\$)/g, (_, varName) => {
          if (varName === "?") return String(this.lastExitCode);
          if (varName === "$") return "1842";
          if (varName === "!") return "1923";
          return this.env.get(varName) || "";
        });
        tokens.push(expanded);
      }
    }

    if (tokens.length === 0) {
      return { stdout: "", stderr: "", exitCode: 0 };
    }

    const [cmd, ...args] = tokens;

    // COMMAND DISPATCH TABLE
    switch (cmd) {
      case "pwd":
        return { stdout: this.cwd, stderr: "", exitCode: 0 };

      case "cd": {
        const dest = args[0] ? this.resolvePath(args[0]) : "/home/learner";
        const node = this.fs.get(dest);
        if (!node) {
          return { stdout: "", stderr: `cd: ${args[0]}: No such file or directory`, exitCode: 1 };
        }
        if (node.type !== "dir") {
          return { stdout: "", stderr: `cd: ${args[0]}: Not a directory`, exitCode: 1 };
        }
        this.cwd = dest;
        this.env.set("PWD", this.cwd);
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "ls": {
        const isLong = args.includes("-l") || args.includes("-la") || args.includes("-al") || args.includes("-lh");
        const isAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
        const targetArg = args.find((a) => !a.startsWith("-"));
        const targetDir = targetArg ? this.resolvePath(targetArg) : this.cwd;

        const targetNode = this.fs.get(targetDir);
        if (!targetNode) {
          return { stdout: "", stderr: `ls: cannot access '${targetArg}': No such file or directory`, exitCode: 2 };
        }

        if (targetNode.type === "file") {
          return { stdout: targetArg || targetDir, stderr: "", exitCode: 0 };
        }

        // Gather children
        const prefix = targetDir === "/" ? "/" : `${targetDir}/`;
        const entries: string[] = [];
        this.fs.forEach((_node, path) => {
          if (path === targetDir) return;
          if (path.startsWith(prefix)) {
            const rel = path.slice(prefix.length);
            if (!rel.includes("/")) {
              entries.push(rel);
            }
          }
        });

        if (isAll) {
          entries.unshift(".", "..");
        }

        entries.sort();

        if (isLong) {
          const lines = entries.map((name) => {
            const fullPath = name === "." ? targetDir : name === ".." ? this.resolvePath(`${targetDir}/..`) : `${prefix}${name}`;
            const n = this.fs.get(fullPath);
            const isDir = n?.type === "dir";
            const perms = isDir ? "drwxr-xr-x" : "-rw-r--r--";
            const size = (n?.size || 4096).toString().padStart(5, " ");
            const owner = n?.owner || "learner";
            const group = n?.group || "learner";
            return `${perms}  1 ${owner} ${group} ${size} Oct 25 01:24 ${name}`;
          });
          return { stdout: `total ${entries.length * 4}\n` + lines.join("\n"), stderr: "", exitCode: 0 };
        }

        return { stdout: entries.join("  "), stderr: "", exitCode: 0 };
      }

      case "mkdir": {
        const hasP = args.includes("-p");
        const dirs = args.filter((a) => !a.startsWith("-"));
        for (const d of dirs) {
          const resolved = this.resolvePath(d);
          if (hasP) {
            const parts = resolved.split("/").filter(Boolean);
            let curr = "";
            for (const p of parts) {
              curr += "/" + p;
              if (!this.fs.has(curr)) {
                this.fs.set(curr, {
                  type: "dir",
                  mode: 0o755,
                  owner: "learner",
                  group: "learner",
                  size: 4096,
                  mtime: new Date(),
                  inode: this.nextInode++,
                });
              }
            }
          } else {
            this.fs.set(resolved, {
              type: "dir",
              mode: 0o755,
              owner: "learner",
              group: "learner",
              size: 4096,
              mtime: new Date(),
              inode: this.nextInode++,
            });
          }
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "touch": {
        const files = args.filter((a) => !a.startsWith("-"));
        for (const f of files) {
          const resolved = this.resolvePath(f);
          const existing = this.fs.get(resolved);
          if (existing) {
            existing.mtime = new Date();
          } else {
            this.fs.set(resolved, {
              type: "file",
              content: "",
              mode: 0o644,
              owner: "learner",
              group: "learner",
              size: 0,
              mtime: new Date(),
              inode: this.nextInode++,
            });
          }
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "cp": {
        const files = args.filter((a) => !a.startsWith("-"));
        if (files.length < 2) {
          return { stdout: "", stderr: "cp: missing destination file operand", exitCode: 1 };
        }
        const src = this.resolvePath(files[0]);
        const dst = this.resolvePath(files[1]);
        const srcNode = this.fs.get(src);
        if (!srcNode) {
          return { stdout: "", stderr: `cp: cannot stat '${files[0]}': No such file or directory`, exitCode: 1 };
        }
        this.fs.set(dst, {
          ...srcNode,
          inode: this.nextInode++,
          mtime: new Date(),
        });
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "mv": {
        const files = args.filter((a) => !a.startsWith("-"));
        if (files.length < 2) {
          return { stdout: "", stderr: "mv: missing destination file operand", exitCode: 1 };
        }
        const src = this.resolvePath(files[0]);
        const dst = this.resolvePath(files[1]);
        const srcNode = this.fs.get(src);
        if (!srcNode) {
          return { stdout: "", stderr: `mv: cannot stat '${files[0]}': No such file or directory`, exitCode: 1 };
        }
        this.fs.set(dst, srcNode);
        this.fs.delete(src);
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "rm": {
        const isRecursive = args.includes("-r") || args.includes("-R") || args.includes("-rf");
        const targets = args.filter((a) => !a.startsWith("-"));
        for (const t of targets) {
          const resolved = this.resolvePath(t);
          if (isRecursive) {
            const prefix = resolved.endsWith("/") ? resolved : resolved + "/";
            const toDel: string[] = [];
            this.fs.forEach((_, path) => {
              if (path === resolved || path.startsWith(prefix)) {
                toDel.push(path);
              }
            });
            toDel.forEach((p) => this.fs.delete(p));
          } else {
            this.fs.delete(resolved);
          }
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "cat": {
        if (args.length === 0) {
          return { stdout: pipeIn, stderr: "", exitCode: 0 };
        }
        let out = "";
        for (const a of args) {
          if (a.startsWith("-")) continue;
          const resolved = this.resolvePath(a);
          const node = this.fs.get(resolved);
          if (!node) {
            return { stdout: "", stderr: `cat: ${a}: No such file or directory`, exitCode: 1 };
          }
          out += node.content || "";
        }
        return { stdout: out.trimEnd(), stderr: "", exitCode: 0 };
      }

      case "head": {
        let linesCount = 10;
        const nIndex = args.indexOf("-n");
        if (nIndex !== -1 && args[nIndex + 1]) {
          linesCount = parseInt(args[nIndex + 1], 10) || 10;
        }
        const file = args.find((a) => !a.startsWith("-") && a !== args[nIndex + 1]);
        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        const lines = text.split("\n").slice(0, linesCount);
        return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
      }

      case "tail": {
        let linesCount = 10;
        const nIndex = args.indexOf("-n");
        if (nIndex !== -1 && args[nIndex + 1]) {
          linesCount = parseInt(args[nIndex + 1], 10) || 10;
        }
        const file = args.find((a) => !a.startsWith("-") && a !== args[nIndex + 1]);
        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        const allLines = text.split("\n");
        const lines = allLines.slice(-linesCount);
        return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
      }

      case "echo": {
        const text = args.join(" ");
        return { stdout: text, stderr: "", exitCode: 0 };
      }

      case "printf": {
        if (args.length === 0) return { stdout: "", stderr: "", exitCode: 0 };
        const format = args[0].replace(/\\n/g, "\n").replace(/\\t/g, "\t");
        const params = args.slice(1);
        let paramIdx = 0;
        const formatted = format.replace(/%([0-9]*d|s|-?[0-9]*s)/g, () => {
          return params[paramIdx++] || "";
        });
        return { stdout: formatted.trimEnd(), stderr: "", exitCode: 0 };
      }

      case "clear":
        return { stdout: "\x1b[2J\x1b[H", stderr: "", exitCode: 0 };

      case "date": {
        const now = new Date();
        if (args.includes("+%Y")) {
          return { stdout: now.getFullYear().toString(), stderr: "", exitCode: 0 };
        }
        return { stdout: now.toUTCString(), stderr: "", exitCode: 0 };
      }

      case "whoami":
        return { stdout: this.env.get("USER") || "learner", stderr: "", exitCode: 0 };

      case "id":
        return { stdout: "uid=1000(learner) gid=1000(learner) groups=1000(learner),4(adm),27(sudo)", stderr: "", exitCode: 0 };

      case "uname":
        if (args.includes("-a")) {
          return {
            stdout: "Linux terminalzero 6.8.0 #1 SMP PREEMPT_DYNAMIC WebAssembly x86_64 GNU/Linux",
            stderr: "",
            exitCode: 0,
          };
        }
        if (args.includes("-m")) return { stdout: "x86_64", stderr: "", exitCode: 0 };
        return { stdout: "Linux", stderr: "", exitCode: 0 };

      case "wc": {
        const isL = args.includes("-l");
        const file = args.find((a) => !a.startsWith("-"));
        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        const lines = text ? text.split("\n").length : 0;
        const words = text ? text.trim().split(/\s+/).length : 0;
        const bytes = text.length;
        if (isL) {
          return { stdout: file ? ` ${lines} ${file}` : ` ${lines}`, stderr: "", exitCode: 0 };
        }
        return { stdout: ` ${lines}  ${words} ${bytes} ${file || ""}`.trimEnd(), stderr: "", exitCode: 0 };
      }

      case "grep": {
        const isI = args.includes("-i");
        const isV = args.includes("-v");
        const isC = args.includes("-c");
        const isN = args.includes("-n");
        const nonFlag = args.filter((a) => !a.startsWith("-"));
        const pattern = nonFlag[0] || "";
        const file = nonFlag[1];

        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }

        const lines = text.split("\n");
        const regex = new RegExp(pattern, isI ? "i" : "");
        const matched: string[] = [];

        lines.forEach((line, idx) => {
          const isMatch = regex.test(line);
          const pass = isV ? !isMatch : isMatch;
          if (pass) {
            matched.push(isN ? `${idx + 1}:${line}` : line);
          }
        });

        if (isC) {
          return { stdout: matched.length.toString(), stderr: "", exitCode: 0 };
        }
        return { stdout: matched.join("\n"), stderr: "", exitCode: matched.length > 0 ? 0 : 1 };
      }

      case "sort": {
        const isR = args.includes("-r");
        const isN = args.includes("-n");
        const file = args.find((a) => !a.startsWith("-"));
        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        const lines = text.split("\n").filter(Boolean);
        lines.sort((a, b) => {
          if (isN) {
            const na = parseFloat(a) || 0;
            const nb = parseFloat(b) || 0;
            return isR ? nb - na : na - nb;
          }
          return isR ? b.localeCompare(a) : a.localeCompare(b);
        });
        return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
      }

      case "uniq": {
        const isC = args.includes("-c");
        const lines = pipeIn.split("\n").filter(Boolean);
        const result: string[] = [];
        let prev = "";
        let count = 0;
        lines.forEach((line) => {
          if (line === prev) {
            count++;
          } else {
            if (prev) {
              result.push(isC ? `      ${count} ${prev}` : prev);
            }
            prev = line;
            count = 1;
          }
        });
        if (prev) {
          result.push(isC ? `      ${count} ${prev}` : prev);
        }
        return { stdout: result.join("\n"), stderr: "", exitCode: 0 };
      }

      case "cut": {
        let delimiter = "\t";
        const dIdx = args.indexOf("-d");
        if (dIdx !== -1 && args[dIdx + 1]) {
          delimiter = args[dIdx + 1];
        }
        let fields = [1];
        const fIdx = args.indexOf("-f");
        if (fIdx !== -1 && args[fIdx + 1]) {
          fields = args[fIdx + 1].split(",").map((n) => parseInt(n, 10));
        }
        const file = args.find((a) => !a.startsWith("-") && a !== args[dIdx + 1] && a !== args[fIdx + 1]);
        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        const lines = text.split("\n").map((line) => {
          const cols = line.split(delimiter);
          return fields.map((f) => cols[f - 1] || "").join(delimiter);
        });
        return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
      }

      case "tr": {
        const isD = args.includes("-d");
        const set1 = args.find((a) => !a.startsWith("-")) || "";
        const set2 = args.filter((a) => !a.startsWith("-"))[1] || "";
        let text = pipeIn;
        if (isD) {
          const cleaned = text.split(set1).join("");
          return { stdout: cleaned, stderr: "", exitCode: 0 };
        }
        if (set1 === "a-z" && set2 === "A-Z") {
          return { stdout: text.toUpperCase(), stderr: "", exitCode: 0 };
        }
        if (set1 === "A-Z" && set2 === "a-z") {
          return { stdout: text.toLowerCase(), stderr: "", exitCode: 0 };
        }
        return { stdout: text, stderr: "", exitCode: 0 };
      }

      case "sed": {
        const expr = args.find((a) => !a.startsWith("-")) || "";
        const file = args.filter((a) => !a.startsWith("-"))[1];
        let text = pipeIn;
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        // s/pattern/replacement/g
        if (expr.startsWith("s/") || expr.startsWith("s#")) {
          const delim = expr[1];
          const parts = expr.split(delim);
          const find = parts[1];
          const repl = parts[2] || "";
          const flags = parts[3] || "";
          const isG = flags.includes("g");
          const regex = new RegExp(find, isG ? "g" : "");
          const transformed = text.replace(regex, repl);
          if (args.includes("-i") && file) {
            const resolved = this.resolvePath(file);
            const n = this.fs.get(resolved);
            if (n) n.content = transformed;
            return { stdout: "", stderr: "", exitCode: 0 };
          }
          return { stdout: transformed, stderr: "", exitCode: 0 };
        }
        if (expr === "1d") {
          const lines = text.split("\n").slice(1);
          return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
        }
        if (expr === "2p" && args.includes("-n")) {
          const lines = text.split("\n");
          return { stdout: lines[1] || "", stderr: "", exitCode: 0 };
        }
        return { stdout: text, stderr: "", exitCode: 0 };
      }

      case "awk": {
        let text = pipeIn;
        const nonFlag = args.filter((a) => !a.startsWith("-"));
        const script = nonFlag[0] || "";
        const file = nonFlag[1];
        if (file) {
          const resolved = this.resolvePath(file);
          text = this.fs.get(resolved)?.content || "";
        }
        const lines = text.split("\n").filter(Boolean);
        const outLines: string[] = [];
        let sum = 0;

        lines.forEach((line) => {
          const fields = line.split(/\s+/);
          if (script.includes("print $2") || script.includes("print \\$2")) {
            outLines.push(fields[1] || "");
          } else if (script.includes("print $NF") || script.includes("print \\$NF")) {
            outLines.push(fields[fields.length - 1] || "");
          } else if (script.includes("$1 > 50") || script.includes("\\$1 > 50")) {
            const val = parseFloat(fields[0]);
            if (val > 50) outLines.push(line);
          } else if (script.includes("{s+=$1}") || script.includes("{s+=\\$1}")) {
            sum += parseFloat(fields[0]) || 0;
          } else if (script.includes("/disk/")) {
            if (line.includes("disk")) outLines.push(fields[1] || "");
          } else {
            outLines.push(fields[0] || "");
          }
        });

        if (script.includes("END {print s}")) {
          return { stdout: sum.toString(), stderr: "", exitCode: 0 };
        }
        return { stdout: outLines.join("\n"), stderr: "", exitCode: 0 };
      }

      case "free":
        return {
          stdout:
            "              total        used        free      shared  buff/cache   available\nMem:           1024         411         612           2          32         820\nSwap:             0           0           0",
          stderr: "",
          exitCode: 0,
        };

      case "df":
        return {
          stdout:
            "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        10G  1.2G  8.3G  13% /\ntmpfs           512M     0  512M   0% /tmp",
          stderr: "",
          exitCode: 0,
        };

      case "ps":
        return {
          stdout:
            "  PID TTY          TIME CMD\n 1842 pts/0    00:00:00 sh\n 1950 pts/0    00:00:00 ps",
          stderr: "",
          exitCode: 0,
        };

      case "sleep":
        return { stdout: "", stderr: "", exitCode: 0 };

      case "base64": {
        if (args.includes("-d")) {
          const str = pipeIn.trim();
          try {
            return { stdout: atob(str), stderr: "", exitCode: 0 };
          } catch {
            return { stdout: "", stderr: "base64: invalid input", exitCode: 1 };
          }
        }
        return { stdout: btoa(pipeIn), stderr: "", exitCode: 0 };
      }

      case "sha256sum":
        // standard sha256 output simulation for exercises
        return {
          stdout: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824  -",
          stderr: "",
          exitCode: 0,
        };

      case "tar": {
        const isC = args.some((a) => a.includes("c"));
        const fIdx = args.findIndex((a) => a.includes("f"));
        const archiveName = args[fIdx + 1];
        if (isC && archiveName) {
          const resolved = this.resolvePath(archiveName);
          this.fs.set(resolved, {
            type: "file",
            content: "TAR_ARCHIVE_MOCK_DATA",
            mode: 0o644,
            owner: "learner",
            group: "learner",
            size: 512,
            mtime: new Date(),
            inode: this.nextInode++,
          });
          return { stdout: "", stderr: "", exitCode: 0 };
        }
        if (args.some((a) => a.includes("t"))) {
          return { stdout: "f1.txt", stderr: "", exitCode: 0 };
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "gzip": {
        const file = args.find((a) => !a.startsWith("-"));
        if (file) {
          const resolved = this.resolvePath(file);
          this.fs.set(resolved + ".gz", {
            type: "file",
            content: "GZIP_COMPRESSED",
            mode: 0o644,
            owner: "learner",
            group: "learner",
            size: 256,
            mtime: new Date(),
            inode: this.nextInode++,
          });
          this.fs.delete(resolved);
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "gunzip": {
        const file = args.find((a) => !a.startsWith("-"));
        if (file && file.endsWith(".gz")) {
          const resolved = this.resolvePath(file);
          const uncompressed = resolved.slice(0, -3);
          this.fs.set(uncompressed, {
            type: "file",
            content: "UNCOMPRESSED_DATA",
            mode: 0o644,
            owner: "learner",
            group: "learner",
            size: 512,
            mtime: new Date(),
            inode: this.nextInode++,
          });
          this.fs.delete(resolved);
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "export": {
        const assignment = args[0] || "";
        if (assignment.includes("=")) {
          const [k, v] = assignment.split("=");
          this.env.set(k, v);
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "env": {
        const lines: string[] = [];
        this.env.forEach((val, key) => lines.push(`${key}=${val}`));
        return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
      }

      case "printenv": {
        const v = args[0];
        if (v) {
          const val = this.env.get(v);
          return val ? { stdout: val, stderr: "", exitCode: 0 } : { stdout: "", stderr: "", exitCode: 1 };
        }
        return this.runSingleCommandWithInput("env", "");
      }

      case "unset": {
        args.forEach((a) => this.env.delete(a));
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      case "history": {
        const lines = this.history.map((h, i) => `  ${(i + 1).toString().padStart(4, " ")}  ${h}`);
        return { stdout: lines.join("\n"), stderr: "", exitCode: 0 };
      }

      default:
        return {
          stdout: "",
          stderr: `bash: ${cmd}: command not found`,
          exitCode: 127,
        };
    }
  }

  async getFilesystemState(): Promise<FilesystemSnapshot> {
    const files: string[] = [];
    const directories: string[] = [];

    const prefix = this.cwd === "/" ? "/" : `${this.cwd}/`;
    this.fs.forEach((node, path) => {
      if (path === this.cwd) return;
      if (path.startsWith(prefix)) {
        const rel = path.slice(prefix.length);
        if (!rel.includes("/")) {
          if (node.type === "dir") directories.push(rel);
          else files.push(rel);
        }
      }
    });

    return { cwd: this.cwd, files, directories };
  }

  async readFile(path: string): Promise<string | null> {
    const resolved = this.resolvePath(path);
    const node = this.fs.get(resolved);
    return node ? node.content || "" : null;
  }

  async resetEnvironment(): Promise<void> {
    this.initDefaultFilesystem();
    this.initDefaultEnv();
    this.cwd = "/home/learner";
    this.lastExitCode = 0;
  }

  async shutdown(): Promise<void> {
    this.status = "disconnected";
    this.statusMessage = "Sandbox session ended";
  }
}
