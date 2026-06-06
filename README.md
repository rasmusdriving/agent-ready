# AgentReady

Make your repository easier for AI coding agents and human contributors to work on.

AgentReady is a local-first CLI that scans a repo, generates practical `AGENTS.md` and contributor instructions, and checks that those instructions stay accurate as the project changes.

```bash
npx agent-ready init
npx agent-ready check
```

## Why Use It?

Open-source maintainers increasingly review contributions from humans and AI-assisted tools. A clear `AGENTS.md`, contribution guide, and pull request checklist can reduce repeated review feedback, but those files drift as scripts and package managers change.

AgentReady treats contributor instructions as something testable.

## What It Catches

- Docs say `npm test`, but your repo uses pnpm.
- `AGENTS.md` references a deleted or missing script.
- `CONTRIBUTING.md` points to a file that no longer exists.
- PR templates ask contributors to run checks that are not defined.
- Multiple package managers are documented for one repo.

## Install

AgentReady runs on Node.js 20 or newer.

```bash
npm install --save-dev agent-ready
```

Or run it directly:

```bash
npx agent-ready --help
```

## Commands

### Initialize Instructions

```bash
npx agent-ready init --dry-run
npx agent-ready init --yes --profile codex --include-pr-template --include-action
```

`init` detects package manager, scripts, docs, framework hints, and basic monorepo markers. It creates files only when they do not already exist.

### Check Instruction Drift

```bash
npx agent-ready check
npx agent-ready check --format markdown
npx agent-ready check --format json
npx agent-ready check --warn-only
```

`check` validates package-manager references, missing scripts, missing file references, and required `AGENTS.md` sections.

### Explain Readiness

```bash
npx agent-ready doctor
```

`doctor` summarizes concrete strengths and next improvements. The score is directional, not a vanity metric or program threshold.

### Create A Repo Context Packet

```bash
npx agent-ready bundle
npx agent-ready bundle --max-chars 8000 --output .agent-ready/repo-context.md
```

`bundle` writes a compact Markdown packet with project summary, detected commands, known instruction files, top-level layout, workflows, and agent guardrails.

### Badge

```bash
npx agent-ready badge
```

## GitHub Actions

Use the CLI in CI:

```yaml
name: AgentReady

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
      - run: npx agent-ready check --format markdown --warn-only >> "$GITHUB_STEP_SUMMARY"
```

## Examples

- [examples/node-basic](examples/node-basic) shows a small Node.js package with generated `AGENTS.md`, AgentReady config, and a CI check workflow.

## Local-First Promise

- No API key required.
- No account required.
- No telemetry by default.
- No repository contents are sent to external services.
- Project scripts are not executed during scanning.

## MVP Scope

AgentReady currently focuses on Node.js repositories:

- npm, pnpm, yarn, and bun lockfile detection
- `package.json` script detection
- `AGENTS.md`, `CONTRIBUTING.md`, PR template, and workflow generation
- command drift validation
- repo context bundle generation
- text, Markdown, and JSON output
- basic monorepo hints

See [ROADMAP.md](ROADMAP.md) for planned Python, Rust, Go, and nested `AGENTS.md` support.

## Relationship To Codex

AgentReady is vendor-neutral, but it treats `AGENTS.md` as a first-class artifact because Codex can use repository guidance and review guidelines from `AGENTS.md` during GitHub code review. AgentReady does not require Codex, OpenAI APIs, or any external AI service.

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run format
```

## Releases

Maintainers should follow [docs/release-checklist.md](docs/release-checklist.md) before publishing to npm or creating a GitHub release.

## Contributing

Issues and PRs are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md), and this repo's [AGENTS.md](AGENTS.md).

## License

Apache-2.0
