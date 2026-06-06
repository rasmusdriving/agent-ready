import { describe, expect, it } from "vitest";
import { extractMarkdownPathReferences } from "../src/markdown-paths.js";

describe("extractMarkdownPathReferences", () => {
  it("extracts normal Markdown links and strips anchors or titles", () => {
    const references = extractMarkdownPathReferences(`
[Release checklist](docs/release-checklist.md)
[Roadmap](ROADMAP.md#phase-3 "Roadmap")
[Example](./examples/node-basic)
`);

    expect(references).toEqual([
      "docs/release-checklist.md",
      "ROADMAP.md",
      "examples/node-basic"
    ]);
  });

  it("ignores external URLs, anchors, package names, and command snippets", () => {
    const references = extractMarkdownPathReferences(`
[OpenAI](https://openai.com/form/codex-for-oss/)
[Anchor](#github-actions)
\`@scope/package\`
\`agentready/agent-ready-action\`
\`npm run check\`

\`\`\`bash
node dist/cli.js check
\`\`\`
`);

    expect(references).toEqual([]);
  });

  it("extracts inline code paths while ignoring plain package names", () => {
    const references = extractMarkdownPathReferences(`
Update \`AGENTS.md\`, \`docs/release-checklist.md\`, and \`src/old-api\`.
Ignore \`typescript\`, \`vitest\`, and \`eslint\`.
`);

    expect(references).toEqual(["AGENTS.md", "docs/release-checklist.md", "src/old-api"]);
  });
});
