export type RuntimeStatus =
  | "uninitialized"
  | "preparing"
  | "downloading_assets"
  | "booting"
  | "connecting_shell"
  | "ready"
  | "error"
  | "disconnected";

export interface RuntimeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface FilesystemSnapshot {
  cwd: string;
  files: string[];
  directories: string[];
}

export interface LinuxRuntimeAdapter {
  id: string;
  name: string;
  type: "v86_wasm" | "posix_wasm";
  getStatus(): RuntimeStatus;
  getStatusMessage(): string;
  initialize(onStatusChange?: (status: RuntimeStatus, message: string) => void): Promise<void>;
  writeInput(data: string): void;
  sendKeystroke(key: string): void;
  executeCommand(command: string, timeoutMs?: number): Promise<RuntimeExecutionResult>;
  onOutput(callback: (data: string) => void): () => void;
  resize(cols: number, rows: number): void;
  getFilesystemState(): Promise<FilesystemSnapshot>;
  readFile(path: string): Promise<string | null>;
  resetEnvironment(): Promise<void>;
  shutdown(): Promise<void>;
}
