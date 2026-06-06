import path from "node:path";
import { describe, expect, it } from "vitest";
import { createInitProposals } from "../src/generator.js";
import { scanRepo } from "../src/scanner.js";
import { createTempRepo, writeJson } from "./helpers.js";

describe("generated Markdown", () => {
  it("pins generated AGENTS.md, CONTRIBUTING.md, and PR template content", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      name: "sample-cli",
      description: "A sample CLI used to pin generated documentation.",
      scripts: {
        dev: "tsx src/cli.ts",
        build: "tsc",
        test: "vitest run",
        lint: "eslint .",
        format: "prettier --check ."
      },
      devDependencies: {
        eslint: "^9.0.0",
        prettier: "^3.0.0",
        typescript: "^5.0.0",
        vitest: "^4.0.0"
      }
    });

    const scan = await scanRepo(root);
    const proposals = await createInitProposals(scan, {
      profile: "codex",
      includePrTemplate: true,
      includeAction: false,
      includeContributing: true
    });
    const byPath = Object.fromEntries(
      proposals.map((proposal) => [proposal.path, proposal.content])
    );

    expect(byPath["AGENTS.md"]).toMatchInlineSnapshot(`
      "# AGENTS.md

      ## Project overview

      sample-cli is a Node.js project distributed with npm using vitest, eslint, prettier, typescript.

      A sample CLI used to pin generated documentation.

      This file includes explicit review guidance for Codex and other coding agents.

      ## Repository layout

      - \`src/\` contains source code when present.
      - \`.github/\` contains repository automation when present.

      ## Setup

      Use npm:

      \`\`\`bash
      npm install
      \`\`\`

      ## Development commands

      \`\`\`bash
      npm run dev
      npm run build
      npm run format
      \`\`\`

      ## Testing

      \`\`\`bash
      npm test
      \`\`\`

      ## Linting and formatting

      \`\`\`bash
      npm run lint
      \`\`\`

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

      Keep this file updated when package-manager, test, lint, build, or release workflows change.
      "
    `);
    expect(byPath["CONTRIBUTING.md"]).toMatchInlineSnapshot(`
      "# Contributing

      Thanks for helping improve this project.

      ## Getting started

      1. Fork the repository.
      2. Install dependencies with \`npm install\`.
      3. Create a focused branch for your change.

      ## Development setup

      \`\`\`bash
      npm run dev
      npm run build
      \`\`\`

      ## Running checks

      \`\`\`bash
      npm test
      npm run lint
      npm run format
      \`\`\`

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
      "
    `);
    expect(byPath[".github/pull_request_template.md"]).toMatchInlineSnapshot(`
      "## Summary

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
      "
    `);
    expect(Object.values(byPath).join("\n")).not.toMatch(/\bnpm (lint|build|format|dev)\b/);
  });
});
