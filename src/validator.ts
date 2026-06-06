import path from "node:path";
import { existsSync } from "node:fs";
import { readTextIfExists } from "./fs.js";
import { loadConfig } from "./config.js";
import { extractMarkdownPathReferences } from "./markdown-paths.js";
import type { PackageManager, RepoScan, ValidationIssue } from "./types.js";

const docPaths = [
  "AGENTS.md",
  "CONTRIBUTING.md",
  "README.md",
  ".github/pull_request_template.md"
];
const managers: PackageManager[] = ["npm", "pnpm", "yarn", "bun"];
const requiredAgentsSections = [
  "Project overview",
  "Setup",
  "Testing",
  "Pull request expectations",
  "Review guidelines",
  "Security and privacy notes"
];

export async function validateRepo(
  scan: RepoScan,
  configPath?: string
): Promise<ValidationIssue[]> {
  const config = await loadConfig(scan.root, configPath);
  const issues: ValidationIssue[] = [];
  const docs = await readDocs(scan.root);

  if (scan.ecosystem === "generic") {
    issues.push({
      category: "unsupported-ecosystem",
      severity: "warning",
      message:
        "No package.json was found. MVP validation currently focuses on Node.js repositories.",
      suggestion:
        "Use AgentReady on a Node.js repo, or add package.json before relying on command checks."
    });
  }

  if (
    (config?.rules.requireAgentsMd ?? true) &&
    !docs.some((doc) => doc.path === "AGENTS.md")
  ) {
    issues.push({
      category: "missing-section",
      severity: "error",
      file: "AGENTS.md",
      message: "AGENTS.md is missing.",
      suggestion: "Run `agent-ready init --yes` to create repository instructions."
    });
  }

  if (
    config?.rules.requireContributing &&
    !docs.some((doc) => doc.path === "CONTRIBUTING.md")
  ) {
    issues.push({
      category: "missing-section",
      severity: "error",
      file: "CONTRIBUTING.md",
      message: "CONTRIBUTING.md is required by config but missing.",
      suggestion: "Run `agent-ready init --yes` or create a human contributor guide."
    });
  }

  if (
    config?.rules.requirePrTemplate &&
    !docs.some((doc) => doc.path === ".github/pull_request_template.md")
  ) {
    issues.push({
      category: "missing-section",
      severity: "error",
      file: ".github/pull_request_template.md",
      message: "A pull request template is required by config but missing.",
      suggestion:
        "Run `agent-ready init --yes --include-pr-template` or create a PR template."
    });
  }

  for (const doc of docs) {
    issues.push(...checkPackageManagerMismatch(doc, scan));
    issues.push(...checkStaleCommands(doc, scan));
    issues.push(...checkMissingFileReferences(doc, scan.root));
  }

  const agents = docs.find((doc) => doc.path === "AGENTS.md");
  if (agents) {
    issues.push(...checkMissingSections(agents.content));
  }

  return issues.filter((issue) => shouldKeepIssue(issue, config?.mode));
}

function checkPackageManagerMismatch(
  doc: { path: string; content: string },
  scan: RepoScan
): ValidationIssue[] {
  if (scan.packageManager === "unknown") {
    return [];
  }

  if (scan.ecosystem !== "node") {
    return [];
  }

  return managers
    .filter((manager) => manager !== scan.packageManager)
    .filter((manager) => commandRegex(manager).test(doc.content))
    .map((manager) => ({
      category: "package-manager-mismatch" as const,
      severity: "warning" as const,
      file: doc.path,
      message: `${doc.path} references ${manager}, but this repo appears to use ${scan.packageManager}.`,
      suggestion: `Use ${scan.packageManager} commands consistently.`
    }));
}

function checkStaleCommands(
  doc: { path: string; content: string },
  scan: RepoScan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  issues.push(...checkInvalidNpmScriptSyntax(doc));

  for (const manager of managers) {
    const matches = doc.content.matchAll(
      new RegExp(
        `\\b${manager}\\s+(?:run\\s+)?(test|lint|build|format|typecheck|dev)\\b`,
        "g"
      )
    );

    for (const match of matches) {
      const script = match[1];
      if (!scan.scripts[script]) {
        issues.push({
          category: "stale-command",
          severity: "error",
          file: doc.path,
          message: `${doc.path} references \`${match[0]}\`, but package.json does not define a ${script} script.`,
          suggestion: `Add a ${script} script or remove the stale command reference.`
        });
      }
    }
  }

  return issues;
}

function checkInvalidNpmScriptSyntax(doc: {
  path: string;
  content: string;
}): ValidationIssue[] {
  const invalidMatches = doc.content.matchAll(
    /\bnpm\s+(lint|build|format|typecheck|dev)\b/g
  );

  return [...invalidMatches].map((match) => ({
    category: "stale-command" as const,
    severity: "error" as const,
    file: doc.path,
    message: `${doc.path} references \`${match[0]}\`, but npm scripts other than test should use \`npm run ${match[1]}\`.`,
    suggestion: `Replace \`${match[0]}\` with \`npm run ${match[1]}\`.`
  }));
}

function checkMissingFileReferences(
  doc: { path: string; content: string },
  root: string
): ValidationIssue[] {
  const candidates = extractMarkdownPathReferences(doc.content);

  return candidates
    .filter((candidate) => !candidate.startsWith(".github/ISSUE_TEMPLATE/"))
    .filter((candidate) => !candidate.includes("*"))
    .filter((candidate) => !existsSyncSafe(path.join(root, candidate)))
    .map((candidate) => ({
      category: "missing-file-reference" as const,
      severity: "warning" as const,
      file: doc.path,
      message: `${doc.path} references \`${candidate}\`, but that path does not exist.`,
      suggestion: "Create the referenced path or update the documentation."
    }));
}

function checkMissingSections(content: string): ValidationIssue[] {
  return requiredAgentsSections
    .filter(
      (section) => !new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "im").test(content)
    )
    .map((section) => ({
      category: "missing-section" as const,
      severity: "warning" as const,
      file: "AGENTS.md",
      message: `AGENTS.md is missing the "${section}" section.`,
      suggestion: `Add a "## ${section}" section.`
    }));
}

async function readDocs(root: string): Promise<Array<{ path: string; content: string }>> {
  const docs: Array<{ path: string; content: string }> = [];

  for (const docPath of docPaths) {
    const content = await readTextIfExists(path.join(root, docPath));
    if (content) {
      docs.push({ path: docPath, content });
    }
  }

  return docs;
}

function commandRegex(manager: PackageManager): RegExp {
  return new RegExp(`\\b${manager}\\s+(install|test|lint|build|format|typecheck|dev)\\b`);
}

function existsSyncSafe(filePath: string): boolean {
  try {
    return existsSync(filePath);
  } catch {
    return false;
  }
}

function shouldKeepIssue(issue: ValidationIssue, mode?: "warn" | "fail"): boolean {
  if (mode === "warn" && issue.severity === "error") {
    return true;
  }

  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
