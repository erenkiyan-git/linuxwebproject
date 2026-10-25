import { describe, it, expect, beforeEach } from "vitest";
import { PosixSandboxAdapter } from "@/features/linux-runtime/posix-sandbox-adapter";

describe("PosixSandboxAdapter Engine Suite", () => {
  let adapter: PosixSandboxAdapter;

  beforeEach(() => {
    adapter = new PosixSandboxAdapter();
  });

  it("executes pwd and returns initial working directory", async () => {
    const res = await adapter.executeCommand("pwd");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe("/home/learner");
  });

  it("executes touch, creates file, and updates filesystem state", async () => {
    await adapter.executeCommand("touch testfile.txt");
    const snapshot = await adapter.getFilesystemState();
    expect(snapshot.files).toContain("testfile.txt");
  });

  it("executes echo with redirection to file, then reads with cat", async () => {
    await adapter.executeCommand("echo 'Linux Mastery' > note.txt");
    const catRes = await adapter.executeCommand("cat note.txt");
    expect(catRes.exitCode).toBe(0);
    expect(catRes.stdout).toBe("Linux Mastery");
  });

  it("handles pipes between commands: echo piped to tr", async () => {
    const res = await adapter.executeCommand("echo 'hello' | tr a-z A-Z");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe("HELLO");
  });

  it("handles grep line filtering", async () => {
    const res = await adapter.executeCommand("grep root /etc/passwd");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("root:x:0:0:root");
  });

  it("handles sed stream substitution", async () => {
    const res = await adapter.executeCommand("echo 'the cat sat' | sed 's/cat/dog/'");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe("the dog sat");
  });

  it("handles awk field extraction", async () => {
    const res = await adapter.executeCommand("echo 'first second third' | awk '{print $2}'");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe("second");
  });

  it("handles environment variables and export", async () => {
    await adapter.executeCommand("export MY_FLAG=active");
    const res = await adapter.executeCommand("printenv MY_FLAG");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toBe("active");
  });
});
