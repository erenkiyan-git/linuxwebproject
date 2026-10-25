import { CommandLesson, ValidationResult } from "@/types/curriculum";
import { FilesystemSnapshot, RuntimeExecutionResult } from "@/types/runtime";

export type ChallengeEvaluationResult = ValidationResult;

export class ChallengeEvaluator {
  /**
   * Helper to determine whether a given command text is relevant to the active lesson.
   * Prevents unrelated commands (e.g., typing 'ls' when 'pwd' or 'sleep' was requested)
   * from passing validation merely because their exit code was 0.
   */
  static isCommandRelevant(cmd: string, lesson: CommandLesson): boolean {
    const trimmed = cmd.trim();
    if (!trimmed) return false;

    const targetCmd = lesson.commandName.trim().toLowerCase();

    // Check if the command matches any full example defined in the lesson
    if (lesson.examples.some((ex) => ex.trim().toLowerCase() === trimmed.toLowerCase())) {
      return true;
    }

    // Split pipeline or multi-command chains (| ; && ||)
    const pipelineSegments = trimmed.split(/[|;&]+/).map((s) => s.trim()).filter(Boolean);

    for (const segment of pipelineSegments) {
      const tokens = segment.split(/\s+/);
      if (tokens.length === 0) continue;

      let binName = tokens[0];

      // Strip wrapper commands like sudo, time, nohup, env
      if (["sudo", "time", "nohup", "env"].includes(binName.toLowerCase()) && tokens.length > 1) {
        binName = tokens[1];
      }

      // Strip leading path like /bin/ls -> ls
      binName = binName.split("/").pop() || binName;

      if (binName.toLowerCase() === targetCmd) {
        return true;
      }
    }

    // Also check if the raw command contains the target command as a word boundary
    const regex = new RegExp(`(^|[\\s|;&])(?:\\S*\\/)?${targetCmd}(\\s|$)`, "i");
    return regex.test(trimmed);
  }

  /**
   * Primary evaluation entry point.
   */
  static evaluate(
    lesson: CommandLesson,
    executionResult: RuntimeExecutionResult,
    fsState: FilesystemSnapshot,
    commandText: string,
    fileContentMap?: Record<string, string>
  ): ChallengeEvaluationResult {
    const { challenge } = lesson;
    const strategy = challenge.validationStrategy;

    // Normalizing text
    const cleanStdout = executionResult.stdout.trim();
    const cleanCmd = commandText.trim();

    // Rule 1: Empty command input can NEVER complete a challenge
    if (!cleanCmd) {
      return {
        passed: false,
        message: "No command entered. Enter a command in the terminal to solve the challenge.",
        expected: `A command executing '${lesson.commandName}' or solving the objective`,
        detected: "Empty / whitespace input",
        tip: `Try running '${lesson.examples[0] || lesson.commandName}' to begin.`,
        strategyUsed: strategy,
      };
    }

    // Rule 2: Non-zero exit code represents a runtime execution failure
    if (executionResult.exitCode !== 0) {
      const errDetail = executionResult.stderr.trim() || `Exit code ${executionResult.exitCode}`;
      return {
        passed: false,
        message: `Command execution failed (${errDetail}). Please check syntax and try again.`,
        expected: "Command to exit with status 0",
        detected: `Exited with status ${executionResult.exitCode}`,
        tip: "Check for typos or invalid arguments, then re-execute.",
        details: executionResult.stderr,
        strategyUsed: strategy,
      };
    }

    // Rule 3: Required technique check if explicitly specified on challenge
    if (challenge.requiredTechnique) {
      const techniqueRegex = new RegExp(`(^|[\\s|;&])${challenge.requiredTechnique}(\\s|$)`, "i");
      if (!techniqueRegex.test(cleanCmd) && !cleanCmd.includes(challenge.requiredTechnique)) {
        return {
          passed: false,
          message: `This challenge specifically requires using technique or flag '${challenge.requiredTechnique}'.`,
          expected: `Command utilizing '${challenge.requiredTechnique}'`,
          detected: cleanCmd,
          tip: `Review the lesson syntax and ensure your command includes '${challenge.requiredTechnique}'.`,
          strategyUsed: "required_technique",
        };
      }
    }

    switch (strategy) {
      case "working_directory": {
        const expectedDir = challenge.expectedWorkingDir || challenge.expectedOutput || "/home/learner";
        const normalizedExpected = expectedDir.trim().replace(/\/+$/, "");
        const normalizedCwd = fsState.cwd.trim().replace(/\/+$/, "");

        const passed = normalizedCwd === normalizedExpected;
        return {
          passed,
          message: passed
            ? challenge.successMessage
            : `Expected current directory '${expectedDir}', but your terminal is in '${fsState.cwd}'.`,
          expected: expectedDir,
          detected: fsState.cwd,
          tip: `Use 'cd ${expectedDir}' to navigate to the target location.`,
          strategyUsed: "working_directory",
        };
      }

      case "exit_code": {
        const isRelevant = this.isCommandRelevant(cleanCmd, lesson);
        if (!isRelevant) {
          return {
            passed: false,
            message: `Command executed with exit code 0, but this challenge requires using '${lesson.commandName}'.`,
            expected: `Command invoking '${lesson.commandName}'`,
            detected: cleanCmd,
            tip: `Run '${lesson.examples[0] || lesson.commandName}' to satisfy this challenge.`,
            strategyUsed: "exit_code",
          };
        }

        return {
          passed: true,
          message: challenge.successMessage,
          strategyUsed: "exit_code",
        };
      }

      case "output_match": {
        // Strict expected output comparison
        if (challenge.expectedOutput) {
          const expected = challenge.expectedOutput.trim();
          const normStdout = cleanStdout.replace(/\r\n/g, "\n");
          const normExpected = expected.replace(/\r\n/g, "\n");

          const passed = normStdout === normExpected || cleanStdout === expected;
          return {
            passed,
            message: passed
              ? challenge.successMessage
              : `Expected output "${expected}", but received "${cleanStdout || "(empty)"}".`,
            expected,
            detected: cleanStdout || "(empty)",
            tip: `Review the syntax: '${lesson.syntax}'`,
            strategyUsed: "output_match",
          };
        }

        // Output pattern regex check
        if (challenge.outputPattern) {
          const regex = new RegExp(challenge.outputPattern, "s");
          const passed = cleanStdout.length > 0 && regex.test(cleanStdout);
          return {
            passed,
            message: passed
              ? challenge.successMessage
              : `Output did not match expected pattern for ${lesson.commandName}. Check the example and try again.`,
            expected: `Output matching pattern /${challenge.outputPattern}/`,
            detected: cleanStdout || "(empty)",
            tip: `Inspect the example: $ ${lesson.examples[0] || lesson.commandName}`,
            strategyUsed: "output_match",
          };
        }

        // Generic output check: requires non-empty stdout AND relevant command
        const isRelevant = this.isCommandRelevant(cleanCmd, lesson);
        if (!isRelevant) {
          return {
            passed: false,
            message: `Command produced output, but this challenge requires '${lesson.commandName}'.`,
            expected: `Command invoking '${lesson.commandName}'`,
            detected: cleanCmd,
            tip: `Run '${lesson.examples[0] || lesson.commandName}'`,
            strategyUsed: "output_match",
          };
        }

        if (cleanStdout.length === 0) {
          return {
            passed: false,
            message: `Command produced no output. Expected output demonstrating '${lesson.commandName}'.`,
            expected: "Non-empty terminal stdout",
            detected: "(no output produced)",
            tip: `Ensure your command prints results or check '${lesson.syntax}'.`,
            strategyUsed: "output_match",
          };
        }

        return {
          passed: true,
          message: challenge.successMessage,
          strategyUsed: "output_match",
        };
      }

      case "file_content":
      case "filesystem_state": {
        // Check expected working directory if requested
        if (challenge.expectedWorkingDir) {
          const normExpected = challenge.expectedWorkingDir.trim().replace(/\/+$/, "");
          const normCwd = fsState.cwd.trim().replace(/\/+$/, "");
          if (normCwd !== normExpected) {
            return {
              passed: false,
              message: `Expected current directory '${challenge.expectedWorkingDir}', but terminal is in '${fsState.cwd}'.`,
              expected: challenge.expectedWorkingDir,
              detected: fsState.cwd,
              tip: `Navigate to '${challenge.expectedWorkingDir}' using cd.`,
              strategyUsed: strategy,
            };
          }
        }

        // Check expected files
        if (challenge.expectedFiles && challenge.expectedFiles.length > 0) {
          const missingFiles = challenge.expectedFiles.filter((f) => {
            const baseF = f.split("/").pop() || f;
            return (
              !fsState.files.includes(f) &&
              !fsState.files.includes(baseF) &&
              !fsState.files.some((existing) => existing.endsWith("/" + baseF))
            );
          });

          if (missingFiles.length > 0) {
            return {
              passed: false,
              message: `Missing required file(s): ${missingFiles.join(", ")}. Verify your file creation command.`,
              expected: `File(s) existing: ${challenge.expectedFiles.join(", ")}`,
              detected: `Current files: [${fsState.files.join(", ")}]`,
              tip: `Create the missing file using '${lesson.commandName} ${missingFiles[0]}'.`,
              strategyUsed: strategy,
            };
          }
        }

        // Check expected directories
        if (challenge.expectedDirectories && challenge.expectedDirectories.length > 0) {
          const missingDirs = challenge.expectedDirectories.filter((d) => {
            const baseD = d.split("/").pop() || d;
            return (
              !fsState.directories.includes(d) &&
              !fsState.directories.includes(baseD) &&
              !fsState.directories.some((existing) => existing.endsWith("/" + baseD))
            );
          });

          if (missingDirs.length > 0) {
            return {
              passed: false,
              message: `Missing required directory: ${missingDirs.join(", ")}. Make sure you created it.`,
              expected: `Directory: ${challenge.expectedDirectories.join(", ")}`,
              detected: `Current directories: [${fsState.directories.join(", ")}]`,
              tip: `Run 'mkdir ${missingDirs[0]}' to create the directory.`,
              strategyUsed: strategy,
            };
          }
        }

        // Check file content checks if any
        if (challenge.fileContentsCheck && fileContentMap) {
          for (const [filePath, expectedContent] of Object.entries(challenge.fileContentsCheck)) {
            const actual = fileContentMap[filePath];
            if (!actual || !actual.includes(expectedContent.trim())) {
              return {
                passed: false,
                message: `File '${filePath}' does not contain expected content "${expectedContent}".`,
                expected: `File '${filePath}' containing "${expectedContent}"`,
                detected: actual ? `"${actual.trim()}"` : "(file empty or missing)",
                tip: `Write the text into '${filePath}' (e.g. echo "${expectedContent}" > ${filePath}).`,
                strategyUsed: strategy,
              };
            }
          }
        }

        return {
          passed: true,
          message: challenge.successMessage,
          strategyUsed: strategy,
        };
      }

      case "pattern_match": {
        if (challenge.outputPattern) {
          const regex = new RegExp(challenge.outputPattern, "i");
          const passed = regex.test(cleanStdout) || regex.test(cleanCmd);
          return {
            passed,
            message: passed
              ? challenge.successMessage
              : `Command or output pattern was not satisfied for '${lesson.commandName}'.`,
            expected: `Matching pattern /${challenge.outputPattern}/`,
            detected: cleanStdout || cleanCmd,
            tip: `Review the command pattern in the lesson examples.`,
            strategyUsed: "pattern_match",
          };
        }

        const isRelevant = this.isCommandRelevant(cleanCmd, lesson);
        return {
          passed: isRelevant,
          message: isRelevant
            ? challenge.successMessage
            : `Challenge requires running '${lesson.commandName}'.`,
          expected: `Command invoking '${lesson.commandName}'`,
          detected: cleanCmd,
          tip: `Try running '${lesson.examples[0] || lesson.commandName}'.`,
          strategyUsed: "pattern_match",
        };
      }

      case "command_executed":
      default: {
        const isRelevant = this.isCommandRelevant(cleanCmd, lesson);
        if (!isRelevant) {
          return {
            passed: false,
            message: `Command executed, but this challenge requires using '${lesson.commandName}'. Please try '${lesson.commandName}'.`,
            expected: `Command invoking '${lesson.commandName}'`,
            detected: cleanCmd,
            tip: `Execute '${lesson.examples[0] || lesson.commandName}' in the terminal.`,
            strategyUsed: "command_executed",
          };
        }

        return {
          passed: true,
          message: challenge.successMessage,
          strategyUsed: "command_executed",
        };
      }
    }
  }
}
