import { promises as fs } from "node:fs";
import path from "node:path";
import { normalizePath, readTextIfExists, writeFileCreatingDirs } from "./fs.js";
import type { RepoScan } from "./types.js";

export interface BundleOptions {
  maxChars: number;
  output: string;
  includeTree: boolean;
  includeScripts: boolean;
  includeWorkflows: boolean;
}

const skippedEntries = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".DS_Store",
  "package-lock.json"
]);

export async function createRepoContextBundle(
  scan: RepoScan,
  options: BundleOptions
): Promise<{ path: string; content: string; truncated: boolean }> {
  const sections = [
    "# AgentReady Repo Context",
    projectSection(scan, await readReadmeSummary(scan.root)),
    commandSection(scan, options.includeScripts),
    docsSection(scan),
    await layoutSection(scan.root, options.includeTree),
    await workflowSection(scan.root, options.includeWorkflows),
    guardrailsSection()
  ];
  const fullContent = `${sections.filter(Boolean).join("\n\n")}\n`;
  const content =
    fullContent.length > options.maxChars
      ? `${fullContent.slice(0, Math.max(0, options.maxChars - 80)).trimEnd()}\n\n_Context truncated by max character limit._\n`
      : fullContent;
  const outputPath = path.resolve(scan.root, options.output);

  await writeFileCreatingDirs(outputPath, content);

  return {
    path: outputPath,
    content,
    truncated: content.length < fullContent.length
  };
}

function projectSection(scan: RepoScan, readmeSummary: string): string {
  const lines = [
    "## Project",
    `- Name: ${scan.packageJson?.name ?? path.basename(scan.root)}`,
    `- Ecosystem: ${scan.packageJson ? "Node.js" : "unknown"}`,
    `- Package manager: ${scan.packageManager}`
  ];

  if (scan.frameworks.length > 0) {
    lines.push(`- Framework hints: ${scan.frameworks.join(", ")}`);
  }

  if (readmeSummary) {
    lines.push("", readmeSummary);
  }

  return lines.join("\n");
}

function commandSection(scan: RepoScan, includeScripts: boolean): string {
  if (!includeScripts) {
    return "";
  }

  const commands = Object.entries(scan.commands)
    .filter(([, command]) => Boolean(command))
    .map(([kind, command]) => `- ${kind}: \`${command}\``);

  return `## Commands\n${commands.length > 0 ? commands.join("\n") : "- No commands detected."}`;
}

function docsSection(scan: RepoScan): string {
  const docs =
    scan.existingDocs.length > 0
      ? scan.existingDocs.map((doc) => `- ${doc}`).join("\n")
      : "- No common contributor docs detected.";

  return `## Known Instruction Files\n${docs}`;
}

async function layoutSection(root: string, includeTree: boolean): Promise<string> {
  if (!includeTree) {
    return "";
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const visible = entries
    .filter((entry) => !skippedEntries.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 60)
    .map((entry) => `- ${entry.isDirectory() ? `${entry.name}/` : entry.name}`);

  return `## Top-Level Layout\n${visible.length > 0 ? visible.join("\n") : "- No files found."}`;
}

async function workflowSection(root: string, includeWorkflows: boolean): Promise<string> {
  if (!includeWorkflows) {
    return "";
  }

  const workflowRoot = path.join(root, ".github", "workflows");

  try {
    const entries = await fs.readdir(workflowRoot, { withFileTypes: true });
    const workflows = entries
      .filter((entry) => entry.isFile())
      .map((entry) => `- ${normalizePath(path.join(".github", "workflows", entry.name))}`);

    return `## Workflows\n${workflows.length > 0 ? workflows.join("\n") : "- No workflows found."}`;
  } catch {
    return "## Workflows\n- No workflows found.";
  }
}

function guardrailsSection(): string {
  return `## Agent Guardrails
- Prefer the commands listed above when verifying changes.
- Keep generated files and dependencies out of manual edits.
- Update instruction docs when package-manager, test, lint, build, or release workflows change.`;
}

async function readReadmeSummary(root: string): Promise<string> {
  const readme = await readTextIfExists(path.join(root, "README.md"));
  if (!readme) {
    return "";
  }

  return (
    readme
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .find((block) => block && !block.startsWith("#") && !block.startsWith("```"))
      ?.replace(/\n/g, " ")
      .slice(0, 600)
      .trim() ?? ""
  );
}
