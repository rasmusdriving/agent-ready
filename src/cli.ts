#!/usr/bin/env node
import process from "node:process";
import path from "node:path";
import { scanRepo } from "./scanner.js";
import { createInitProposals } from "./generator.js";
import { writeFileCreatingDirs } from "./fs.js";
import { formatDoctor, formatIssues, formatScan } from "./format.js";
import { validateRepo } from "./validator.js";
import type { AgentProfile, OutputFormat, ValidationIssue } from "./types.js";

interface CliOptions {
  command: string;
  root: string;
  yes: boolean;
  dryRun: boolean;
  profile: AgentProfile;
  includePrTemplate: boolean;
  includeAction: boolean;
  includeContributing: boolean;
  format: OutputFormat;
  warnOnly: boolean;
  strict: boolean;
  config?: string;
}

const commands = ["init", "check", "doctor", "badge", "help"];

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.command === "help") {
    process.stdout.write(helpText());
    return;
  }

  if (options.command === "badge") {
    process.stdout.write(
      "[![AgentReady](https://img.shields.io/badge/agent--ready-checked-brightgreen)](https://github.com/rasmusdriving/agent-ready)\n"
    );
    return;
  }

  const scan = await scanRepo(options.root);

  if (options.command === "init") {
    const proposals = await createInitProposals(scan, {
      profile: options.profile,
      includePrTemplate: options.includePrTemplate,
      includeAction: options.includeAction,
      includeContributing: options.includeContributing
    });

    process.stdout.write(formatScan(scan));
    process.stdout.write("\nFiles:\n");
    for (const proposal of proposals) {
      process.stdout.write(
        `- ${proposal.action === "create" ? "create" : "skip"} ${proposal.path}\n`
      );
    }

    if (options.dryRun) {
      process.stdout.write("\nDry run only. No files were written.\n");
      return;
    }

    if (!options.yes) {
      process.stdout.write("\nRun with --yes to write the proposed files.\n");
      return;
    }

    for (const proposal of proposals) {
      if (proposal.action === "create") {
        await writeFileCreatingDirs(
          path.join(options.root, proposal.path),
          proposal.content
        );
      }
    }

    process.stdout.write("\nAgentReady files written.\n");
    return;
  }

  if (options.command === "check") {
    const issues = await validateRepo(scan, options.config);
    process.stdout.write(formatIssues(issues, options.format));
    const blocking = issues.some((issue) => issue.severity === "error");
    process.exitCode = blocking && !options.warnOnly ? 1 : 0;
    return;
  }

  if (options.command === "doctor") {
    const issues = await validateRepo(scan, options.config);
    process.stdout.write(
      formatDoctor(
        calculateScore(scan, issues),
        strongSignals(scan),
        needsWork(scan, issues)
      )
    );
    return;
  }

  throw new Error(`Unknown command: ${options.command}`);
}

function parseArgs(args: string[]): CliOptions {
  const command = commands.includes(args[0] ?? "") ? (args.shift() ?? "help") : "help";
  const options: CliOptions = {
    command,
    root: process.cwd(),
    yes: false,
    dryRun: false,
    profile: "generic",
    includePrTemplate: false,
    includeAction: false,
    includeContributing: true,
    format: "text",
    warnOnly: false,
    strict: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--yes") options.yes = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--include-pr-template") options.includePrTemplate = true;
    else if (arg === "--include-action") options.includeAction = true;
    else if (arg === "--no-contributing") options.includeContributing = false;
    else if (arg === "--warn-only") options.warnOnly = true;
    else if (arg === "--strict") options.strict = true;
    else if (arg === "--root" && next) {
      options.root = path.resolve(next);
      index += 1;
    } else if (arg === "--profile" && isProfile(next)) {
      options.profile = next;
      index += 1;
    } else if (arg === "--format" && isFormat(next)) {
      options.format = next;
      index += 1;
    } else if (arg === "--config" && next) {
      options.config = next;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.command = "help";
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function calculateScore(
  scan: Awaited<ReturnType<typeof scanRepo>>,
  issues: ValidationIssue[]
): number {
  const base = scan.packageJson ? 45 : 20;
  const commandPoints =
    ["test", "lint", "build"].filter((kind) => scan.commands[kind as "test"]).length * 10;
  const docPoints = scan.existingDocs.includes("AGENTS.md") ? 15 : 0;
  const penalty = issues.filter((issue) => issue.severity === "error").length * 10;
  return Math.max(0, Math.min(100, base + commandPoints + docPoints - penalty));
}

function strongSignals(scan: Awaited<ReturnType<typeof scanRepo>>): string[] {
  const signals = [`Package manager detected: ${scan.packageManager}`];

  for (const kind of ["test", "lint", "build"] as const) {
    if (scan.commands[kind]) {
      signals.push(`${kind} command documented: ${scan.commands[kind]}`);
    }
  }

  if (scan.existingDocs.includes("AGENTS.md")) {
    signals.push("AGENTS.md present");
  }

  return signals;
}

function needsWork(
  scan: Awaited<ReturnType<typeof scanRepo>>,
  issues: ValidationIssue[]
): string[] {
  const work = issues.map((issue) => issue.message);

  if (!scan.existingDocs.includes(".github/pull_request_template.md")) {
    work.push("No PR template found");
  }

  if (!scan.scripts.test) {
    work.push("No test script found");
  }

  return work;
}

function isProfile(value: string | undefined): value is AgentProfile {
  return value === "generic" || value === "codex";
}

function isFormat(value: string | undefined): value is OutputFormat {
  return value === "text" || value === "json" || value === "markdown";
}

function helpText(): string {
  return `AgentReady

Usage:
  agent-ready init [--yes] [--dry-run] [--profile codex|generic]
  agent-ready check [--format text|json|markdown] [--warn-only]
  agent-ready doctor
  agent-ready badge

Options:
  --include-pr-template   Create .github/pull_request_template.md during init
  --include-action        Create .github/workflows/agent-ready.yml during init
  --no-contributing       Skip CONTRIBUTING.md during init
  --root <path>           Scan a different repository root
`;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
