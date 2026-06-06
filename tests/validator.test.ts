import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepo } from "../src/scanner.js";
import { validateRepo } from "../src/validator.js";
import { createTempRepo, writeJson, writeText } from "./helpers.js";

describe("validateRepo", () => {
  it("finds stale commands and package manager mismatches", async () => {
    const root = await createTempRepo();
    await writeText(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        build: "tsc"
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
pnpm test

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

    expect(issues.some((issue) => issue.category === "package-manager-mismatch")).toBe(
      true
    );
    expect(issues.some((issue) => issue.category === "stale-command")).toBe(true);
  });

  it("returns no issues for generated command references", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        test: "vitest run",
        lint: "eslint ."
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

    expect(issues).toEqual([]);
  });

  it("finds invalid npm script shorthand", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        lint: "eslint ."
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
No tests.

## Linting and formatting
npm lint

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

    expect(issues.some((issue) => issue.message.includes("npm run lint"))).toBe(true);
  });

  it("checks missing local references without flagging URLs, anchors, commands, or package names", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        test: "vitest run"
      }
    });
    await writeText(path.join(root, "docs", "existing.md"), "# Existing\n");
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
See [existing docs](docs/existing.md), [missing docs](docs/missing.md), and [OpenAI](https://openai.com/).

Also keep \`src/old-api\` updated, ignore \`agentready/agent-ready-action\`, and run \`npm run check\`.

## Review guidelines
Check commands.

## Security and privacy notes
Stay local.
`
    );

    const scan = await scanRepo(root);
    const issues = await validateRepo(scan);
    const missingPathMessages = issues
      .filter((issue) => issue.category === "missing-file-reference")
      .map((issue) => issue.message);

    expect(missingPathMessages).toEqual([
      "AGENTS.md references `docs/missing.md`, but that path does not exist.",
      "AGENTS.md references `src/old-api`, but that path does not exist."
    ]);
  });

  it("does not mark Python repositories as unsupported", async () => {
    const root = await createTempRepo();
    await writeText(path.join(root, "requirements.txt"), "pytest==8.0.0\n");
    await writeText(
      path.join(root, "AGENTS.md"),
      `# AGENTS.md

## Project overview
Sample.

## Setup
python -m pip install -r requirements.txt

## Testing
python -m pytest

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

    expect(issues.some((issue) => issue.category === "unsupported-ecosystem")).toBe(false);
  });
});
