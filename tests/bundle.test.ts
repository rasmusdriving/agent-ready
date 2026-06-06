import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRepoContextBundle } from "../src/bundle.js";
import { scanRepo } from "../src/scanner.js";
import { createTempRepo, writeJson, writeText } from "./helpers.js";

describe("createRepoContextBundle", () => {
  it("writes a compact repo context packet", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      name: "sample",
      scripts: {
        test: "vitest run",
        lint: "eslint ."
      }
    });
    await writeText(path.join(root, "README.md"), "# Sample\n\nA tiny sample project.\n");
    await writeText(path.join(root, "AGENTS.md"), "# AGENTS.md\n");

    const scan = await scanRepo(root);
    const result = await createRepoContextBundle(scan, {
      output: ".agent-ready/repo-context.md",
      maxChars: 12000,
      includeTree: true,
      includeScripts: true,
      includeWorkflows: true
    });

    expect(result.path).toBe(path.join(root, ".agent-ready", "repo-context.md"));
    expect(result.content).toContain("# AgentReady Repo Context");
    expect(result.content).toContain("- test: `npm test`");
    expect(result.content).toContain("- AGENTS.md");
    expect(result.truncated).toBe(false);
  });

  it("respects the max character limit", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), { name: "sample" });

    const scan = await scanRepo(root);
    const result = await createRepoContextBundle(scan, {
      output: ".agent-ready/repo-context.md",
      maxChars: 120,
      includeTree: true,
      includeScripts: true,
      includeWorkflows: true
    });

    expect(result.content.length).toBeLessThanOrEqual(120);
    expect(result.truncated).toBe(true);
  });
});
