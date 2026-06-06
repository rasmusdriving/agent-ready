import type { OutputFormat, RepoScan, ValidationIssue } from "./types.js";

export function formatScan(scan: RepoScan): string {
  const lines = [
    "AgentReady scanned your repository.",
    "",
    "Detected:",
    `- Ecosystem: ${formatEcosystem(scan)}`,
    `- Package manager: ${scan.packageManager}`,
    `- Test command: ${scan.commands.test ?? "not detected"}`,
    `- Lint command: ${scan.commands.lint ?? "not detected"}`,
    `- Build command: ${scan.commands.build ?? "not detected"}`
  ];

  if (scan.lockfiles.length > 1) {
    lines.push("", `Warning: multiple lockfiles detected: ${scan.lockfiles.join(", ")}`);
  }

  return `${lines.join("\n")}\n`;
}

function formatEcosystem(scan: RepoScan): string {
  if (scan.ecosystem === "node") {
    return "Node.js";
  }

  if (scan.ecosystem === "python") {
    return "Python";
  }

  return "unknown";
}

export function formatIssues(issues: ValidationIssue[], format: OutputFormat): string {
  if (format === "json") {
    return `${JSON.stringify({ issues, count: issues.length }, null, 2)}\n`;
  }

  if (format === "markdown") {
    return formatMarkdownIssues(issues);
  }

  return formatTextIssues(issues);
}

export function formatDoctor(score: number, strong: string[], needsWork: string[]): string {
  return `Agent readiness score: ${score}/100

Strong:
${bulletList(strong)}

Needs work:
${bulletList(needsWork)}
`;
}

function formatTextIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "AgentReady found no issues.\n";
  }

  return `AgentReady found ${issues.length} issue${issues.length === 1 ? "" : "s"}.

${issues
  .map(
    (issue) => `[${issue.category}]
${issue.message}

Suggested fix:
${issue.suggestion}`
  )
  .join("\n\n")}
`;
}

function formatMarkdownIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "## AgentReady\n\nNo instruction drift detected.\n";
  }

  const rows = issues
    .map(
      (issue) =>
        `| ${issue.severity} | ${issue.category} | ${escapeTable(issue.file ?? "-")} | ${escapeTable(issue.message)} | ${escapeTable(issue.suggestion)} |`
    )
    .join("\n");

  return `## AgentReady

Found ${issues.length} issue${issues.length === 1 ? "" : "s"}.

| Severity | Category | File | Message | Suggested fix |
| --- | --- | --- | --- | --- |
${rows}
`;
}

function bulletList(values: string[]): string {
  if (values.length === 0) {
    return "- None yet";
  }

  return values.map((value) => `- ${value}`).join("\n");
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
