import { describe, it, expect } from "vitest";
import { ChallengeEvaluator } from "@/features/challenges/challenge-evaluator";
import { getLessonById } from "@/data/curriculum";

describe("ChallengeEvaluator Suite (Test Group B: Challenge Validation)", () => {
  it("validates output matching strategy for pwd with correct output", () => {
    const pwdLesson = getLessonById("w1d1_01_pwd");
    expect(pwdLesson).toBeDefined();

    const result = ChallengeEvaluator.evaluate(
      pwdLesson!,
      { stdout: "/home/learner", stderr: "", exitCode: 0, durationMs: 10 },
      { cwd: "/home/learner", files: [], directories: [] },
      "pwd"
    );

    expect(result.passed).toBe(true);
    expect(result.message).toContain("Great job");
  });

  it("rejects output matching when output does not match expected pattern", () => {
    const pwdLesson = getLessonById("w1d1_01_pwd");
    expect(pwdLesson).toBeDefined();

    const result = ChallengeEvaluator.evaluate(
      pwdLesson!,
      { stdout: "something_completely_wrong", stderr: "", exitCode: 0, durationMs: 10 },
      { cwd: "/home/learner", files: [], directories: [] },
      "pwd"
    );

    expect(result.passed).toBe(false);
  });

  it("rejects empty command input", () => {
    const pwdLesson = getLessonById("w1d1_01_pwd");
    const result = ChallengeEvaluator.evaluate(
      pwdLesson!,
      { stdout: "/home/learner", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: [], directories: [] },
      "   "
    );

    expect(result.passed).toBe(false);
    expect(result.message).toContain("No command entered");
  });

  it("rejects non-zero exit code execution failure", () => {
    const pwdLesson = getLessonById("w1d1_01_pwd");
    const result = ChallengeEvaluator.evaluate(
      pwdLesson!,
      { stdout: "", stderr: "bash: invalid_command_123: command not found", exitCode: 127, durationMs: 5 },
      { cwd: "/home/learner", files: [], directories: [] },
      "invalid_command_123"
    );

    expect(result.passed).toBe(false);
    expect(result.message).toContain("Command execution failed");
  });

  it("rejects successful command that is completely irrelevant to the active challenge", () => {
    // Challenge is sleep, user runs ls
    const sleepLesson = getLessonById("w2d14_96_sleep");
    expect(sleepLesson).toBeDefined();

    const result = ChallengeEvaluator.evaluate(
      sleepLesson!,
      { stdout: "file1.txt file2.txt", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: ["file1.txt"], directories: [] },
      "ls"
    );

    expect(result.passed).toBe(false);
    expect(result.message).toContain("requires using 'sleep'");
  });

  it("accepts valid alternative solutions and flags", () => {
    const lsLesson = getLessonById("w1d1_02_ls");
    expect(lsLesson).toBeDefined();

    // User runs 'ls -la /home' instead of just 'ls'
    const result = ChallengeEvaluator.evaluate(
      lsLesson!,
      { stdout: "total 8\ndrwxr-xr-x learner", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: [], directories: [] },
      "ls -la /home"
    );

    expect(result.passed).toBe(true);
  });

  it("validates filesystem state strategy when required files exist", () => {
    const touchLesson = getLessonById("w1d2_08_touch");
    expect(touchLesson).toBeDefined();

    // Positive case
    const passResult = ChallengeEvaluator.evaluate(
      touchLesson!,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: ["hello.txt"], directories: [] },
      "touch hello.txt"
    );
    expect(passResult.passed).toBe(true);

    // Negative case: missing hello.txt
    const failResult = ChallengeEvaluator.evaluate(
      touchLesson!,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: ["other.txt"], directories: [] },
      "touch other.txt"
    );
    expect(failResult.passed).toBe(false);
    expect(failResult.message).toContain("Missing required file");
  });

  it("validates filesystem directory creation for mkdir", () => {
    const mkdirLesson = getLessonById("w1d2_09_mkdir");
    expect(mkdirLesson).toBeDefined();

    // Positive case: workspace dir created
    const passResult = ChallengeEvaluator.evaluate(
      mkdirLesson!,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: [], directories: ["workspace"] },
      "mkdir workspace"
    );
    expect(passResult.passed).toBe(true);

    // Negative case: wrong dir
    const failResult = ChallengeEvaluator.evaluate(
      mkdirLesson!,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: [], directories: ["random_dir"] },
      "mkdir random_dir"
    );
    expect(failResult.passed).toBe(false);
    expect(failResult.message).toContain("Missing required directory");
  });

  it("validates file content checks if specified", () => {
    const redirectLesson = getLessonById("w2d8_51_redirect_out");
    expect(redirectLesson).toBeDefined();

    // Positive: file has expected text
    const passResult = ChallengeEvaluator.evaluate(
      redirectLesson!,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: ["test_out.txt"], directories: [] },
      "echo 'Terminal Zero' > test_out.txt",
      { "test_out.txt": "Terminal Zero\n" }
    );
    expect(passResult.passed).toBe(true);

    // Negative: file has different text
    const failResult = ChallengeEvaluator.evaluate(
      redirectLesson!,
      { stdout: "", stderr: "", exitCode: 0, durationMs: 5 },
      { cwd: "/home/learner", files: ["test_out.txt"], directories: [] },
      "echo 'Different' > test_out.txt",
      { "test_out.txt": "Different\n" }
    );
    expect(failResult.passed).toBe(false);
    expect(failResult.message).toContain("does not contain expected content");
  });
});
