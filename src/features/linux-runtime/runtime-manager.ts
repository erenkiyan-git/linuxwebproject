import { LinuxRuntimeAdapter, RuntimeStatus } from "@/types/runtime";
import { PosixSandboxAdapter } from "./posix-sandbox-adapter";
import { V86RuntimeAdapter } from "./v86-adapter";

export type RuntimeEnginePreference = "auto" | "v86" | "posix";

class RuntimeManager {
  private activeAdapter: LinuxRuntimeAdapter | null = null;
  private currentPreference: RuntimeEnginePreference = "auto";
  private statusListeners: Set<(status: RuntimeStatus, message: string) => void> = new Set();

  getActiveAdapter(): LinuxRuntimeAdapter {
    if (!this.activeAdapter) {
      // Default to POSIX sandbox or v86 based on environment
      this.activeAdapter = new PosixSandboxAdapter();
    }
    return this.activeAdapter;
  }

  getPreference(): RuntimeEnginePreference {
    return this.currentPreference;
  }

  async switchAdapter(preference: RuntimeEnginePreference): Promise<LinuxRuntimeAdapter> {
    this.currentPreference = preference;
    if (this.activeAdapter) {
      await this.activeAdapter.shutdown();
    }

    if (preference === "v86") {
      this.activeAdapter = new V86RuntimeAdapter();
    } else {
      this.activeAdapter = new PosixSandboxAdapter();
    }

    await this.activeAdapter.initialize((st, msg) => {
      this.notifyStatus(st, msg);
    });

    return this.activeAdapter;
  }

  onStatusChange(cb: (status: RuntimeStatus, message: string) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private notifyStatus(status: RuntimeStatus, message: string) {
    this.statusListeners.forEach((l) => l(status, message));
  }
}

export const runtimeManager = new RuntimeManager();
