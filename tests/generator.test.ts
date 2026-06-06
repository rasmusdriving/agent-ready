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

  it("generates conservative Python guidance", async () => {
    const root = await createTempRepo();
    await writeText(
      path.join(root, "requirements.txt"),
      `pytest==8.0.0
ruff==0.6.0
`
    );

    const scan = await scanRepo(root);
    const proposals = await createInitProposals(scan, {
      profile: "codex",
      includePrTemplate: false,
      includeAction: false,
      includeContributing: true
    });
    const agents = proposals.find((proposal) => proposal.path === "AGENTS.md")?.content;

    expect(agents).toContain("Python project using pip");
    expect(agents).toContain("python -m pip install -r requirements.txt");
    expect(agents).toContain("python -m pytest");
    expect(agents).toContain("python -m ruff check .");
    expect(agents).not.toContain("Node.js project");
    expect(agents).not.toContain("npm install");
  });
});
