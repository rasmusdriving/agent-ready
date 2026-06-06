import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepo } from "../src/scanner.js";
import { validateRepo } from "../src/validator.js";
import { createTempRepo, writeJson, writeText } from "./helpers.js";

describe("config rules", () => {
  it("enforces required pull request templates", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        test: "vitest run"
      }
    });
    await writeJson(path.join(root, ".agent-ready/config.json"), {
      version: 1,
      profile: "generic",
      mode: "warn",
      commands: {},
      docs: {
        agents: "AGENTS.md",
        contributing: "CONTRIBUTING.md",
        prTemplate: ".github/pull_request_template.md"
      },
      rules: {
        requireAgentsMd: true,
        requireContributing: false,
        requirePrTemplate: true,
        checkPackageManagerMismatch: true,
        checkMissingScripts: true,
        checkMissingFileReferences: true
      }
    });
    await writeText(
      path.join(root, "AGENTS.md"),
      `# AGENTS.md

## Project overview
Sample.

## Setup
npm install

## Testing
npm test

## Pull request expectations
Run checks.

## Review guidelines
Check commands.

## Security and privacy notes
Stay local.
`
    );

    const scan = await scanRepo(root);
    const issues = await validateRepo(scan);

    expect(issues.some((issue) => issue.file === ".github/pull_request_template.md")).toBe(
      true
    );
  });
});
