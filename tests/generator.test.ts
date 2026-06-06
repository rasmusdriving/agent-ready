import path from "node:path";
import { describe, expect, it } from "vitest";
import { createInitProposals } from "../src/generator.js";
import { scanRepo } from "../src/scanner.js";
import { createTempRepo, writeJson, writeText } from "./helpers.js";

describe("createInitProposals", () => {
  it("creates safe proposals and skips existing files", async () => {
    const root = await createTempRepo();
    await writeText(path.join(root, "AGENTS.md"), "# Existing\n");
    await writeJson(path.join(root, "package.json"), {
      name: "sample",
      scripts: {
        test: "vitest run"
      }
    });

    const scan = await scanRepo(root);
    const proposals = await createInitProposals(scan, {
      profile: "codex",
      includePrTemplate: true,
      includeAction: true,
      includeContributing: true
    });

    expect(proposals.find((proposal) => proposal.path === "AGENTS.md")?.action).toBe(
      "skip-existing"
    );
    expect(proposals.find((proposal) => proposal.path === "CONTRIBUTING.md")?.action).toBe(
      "create"
    );
    expect(proposals.map((proposal) => proposal.path)).toContain(
      ".github/workflows/agent-ready.yml"
    );
  });
});
