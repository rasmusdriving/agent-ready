import path from "node:path";
import { pathExists } from "./fs.js";
import { defaultConfig } from "./config.js";
import type { AgentProfile, FileProposal, RepoScan } from "./types.js";

export interface InitOptions {
  profile: AgentProfile;
  includePrTemplate: boolean;
  includeAction: boolean;
  includeContributing: boolean;
}

export async function createInitProposals(
  scan: RepoScan,
  options: InitOptions
): Promise<FileProposal[]> {
  const proposals: Array<Omit<FileProposal, "action">> = [
    { path: "AGENTS.md", content: generateAgentsMd(scan, options.profile) },
    {
      path: ".agent-ready/config.json",
      content: `${JSON.stringify(defaultConfig(scan, options.profile), null, 2)}\n`
    }
  ];

  if (options.includeContributing) {
    proposals.push({ path: "CONTRIBUTING.md", content: generateContributingMd(scan) });
  }

  if (options.includePrTemplate) {
    proposals.push({
      path: ".github/pull_request_template.md",
      content: generatePullRequestTemplate()
    });
  }

  if (options.includeAction) {
    proposals.push({
      path: ".github/workflows/agent-ready.yml",
      content: generateWorkflow()
    });
  }

  return Promise.all(
    proposals.map(async (proposal) => ({
      ...proposal,
      action: (await pathExists(path.join(scan.root, proposal.path)))
        ? "skip-existing"
        : "create"
    }))
  );
}

export function generateAgentsMd(scan: RepoScan, profile: AgentProfile): string {
  const projectName =
    scan.packageJson?.name ?? scan.python?.name ?? path.basename(scan.root);
  const description =
    scan.packageJson?.description ??
    scan.python?.description ??
    "Repository purpose is not documented yet.";
  const profileNote =
    profile === "codex"
      ? "This file includes explicit review guidance for Codex and other coding agents."
      : "This file is written for human contributors and coding agents.";

  return `# AGENTS.md

## Project overview

${projectName} is a ${describeRepo(scan)}.

${description}

${profileNote}

## Repository layout

${layoutBullets(scan)}

## Setup

Use ${scan.packageManager}:

\`\`\`bash
${scan.commands.install ?? "npm install"}
\`\`\`

## Development commands

${commandBlock(scan, ["dev", "build", "typecheck", "format"])}

## Testing

${commandSection(scan, "test", "No test script was detected. Add one before relying on automated checks.")}

## Linting and formatting

${commandSection(scan, "lint", "No lint script was detected. Add one if this repo enforces linting.")}

## Pull request expectations

Before opening a PR:

1. Run the documented test command when one exists.
2. Run the documented lint or formatting command when one exists.
3. Update docs when behavior, commands, or generated templates change.
4. Add or update tests for scanner, generator, validator, or CLI behavior changes.

## Review guidelines

Focus review on:

- Incorrect package-manager or command detection.
- Unsafe file writes or unexpected overwrites.
- Generated Markdown that is vague, stale, or inconsistent with the repo.
- Breaking changes to the config format or CLI output.
- Missing tests for new detection or validation behavior.

## Files and directories to avoid editing casually

- \`dist/\`, \`coverage/\`, and \`node_modules/\` are generated and should not be edited.
- \`.agent-ready/config.json\` controls validation behavior; update it intentionally.
- GitHub workflow files affect CI and release behavior.

## Security and privacy notes

- AgentReady must remain local-first and must not send repository contents to external services.
- Do not execute arbitrary project scripts during repository scanning.
- Treat generated contributor guidance as documentation, not as a security boundary.

## Maintainer notes

${maintainerNotes(scan)}
`;
}

export function generateContributingMd(scan: RepoScan): string {
  return `# Contributing

Thanks for helping improve this project.

## Getting started

1. Fork the repository.
2. Install dependencies with \`${scan.commands.install ?? "npm install"}\`.
3. Create a focused branch for your change.

## Development setup

${commandBlock(scan, ["dev", "build", "typecheck"])}

## Running checks

${commandBlock(scan, ["test", "lint", "format"])}

## Opening pull requests

- Keep changes focused and explain why they are needed.
- Update generated documentation snapshots or examples when behavior changes.
- Mention any command you could not run.

## Reporting bugs

Open an issue with the command you ran, the expected result, and the actual result.

## Requesting features

Describe the maintainer workflow the feature would improve.

## Code style

Follow the existing TypeScript style and keep modules small.

## Release process

Releases are documented in \`CHANGELOG.md\`. Maintainers publish npm releases from tagged commits.
`;
}

export function generatePullRequestTemplate(): string {
  return `## Summary

Describe what changed and why.

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Refactor
- [ ] Maintenance

## Checks

- [ ] I ran the test command documented in AGENTS.md.
- [ ] I ran the lint command documented in AGENTS.md.
- [ ] I updated docs if behavior changed.
- [ ] I added or updated tests where appropriate.

## Notes for reviewers

Mention anything that deserves extra review attention.
`;
}

export function generateWorkflow(): string {
  return `name: AgentReady

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  agent-ready:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx @rasmusdriving/agent-ready check --format markdown --warn-only >> "$GITHUB_STEP_SUMMARY"
`;
}

function describeRepo(scan: RepoScan): string {
  if (scan.ecosystem === "python") {
    const tools =
      scan.python && scan.python.tools.length > 0
        ? ` with ${scan.python.tools.join(", ")} detected`
        : "";
    return `Python project using ${scan.packageManager}${tools}`;
  }

  if (!scan.packageJson) {
    return "generic repository";
  }

  const frameworks =
    scan.frameworks.length > 0 ? ` using ${scan.frameworks.join(", ")}` : "";
  return `Node.js project distributed with ${scan.packageManager}${frameworks}`;
}

function layoutBullets(scan: RepoScan): string {
  const bullets = [
    "- `src/` contains source code when present.",
    "- `.github/` contains repository automation when present."
  ];

  if (scan.monorepo.detected) {
    bullets.push(
      `- Monorepo markers detected: ${scan.monorepo.markers.map((marker) => `\`${marker}\``).join(", ")}.`
    );
    bullets.push(
      "- Add nested AGENTS.md files for package-specific guidance when packages diverge."
    );
  }

  if (scan.python) {
    bullets.push(
      `- Python markers detected: ${scan.python.files.map((file) => `\`${file}\``).join(", ")}.`
    );
  }

  return bullets.join("\n");
}

function commandBlock(scan: RepoScan, kinds: Array<keyof RepoScan["commands"]>): string {
  const commands = kinds.map((kind) => scan.commands[kind]).filter(Boolean);

  if (commands.length === 0) {
    return "No matching scripts were detected.";
  }

  return `\`\`\`bash\n${commands.join("\n")}\n\`\`\``;
}

function commandSection(
  scan: RepoScan,
  kind: keyof RepoScan["commands"],
  fallback: string
): string {
  const command = scan.commands[kind];
  if (!command) {
    return fallback;
  }

  return `\`\`\`bash\n${command}\n\`\`\``;
}

function maintainerNotes(scan: RepoScan): string {
  if (scan.lockfiles.length > 1) {
    return `Multiple lockfiles were detected: ${scan.lockfiles.join(", ")}. Prefer one package manager.`;
  }

  return "Keep this file updated when package-manager, test, lint, build, or release workflows change.";
}
