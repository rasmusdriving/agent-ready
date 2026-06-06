# AgentReady Repo Context

## Project

- Name: agent-ready-node-basic-example
- Ecosystem: Node.js
- Package manager: npm
- Framework hints: vitest, eslint, typescript

This example shows the files AgentReady creates for a small Node.js package with test, lint, and build scripts.

## Commands

- install: `npm install`
- test: `npm test`
- lint: `npm run lint`
- build: `npm run build`

## Known Instruction Files

- README.md
- AGENTS.md
- .github/pull_request_template.md

## Top-Level Layout

- .agent-ready/
- .github/
- AGENTS.md
- package.json
- README.md

## Workflows

- .github/workflows/agent-ready.yml

## Agent Guardrails

- Prefer the commands listed above when verifying changes.
- Keep generated files and dependencies out of manual edits.
- Update instruction docs when package-manager, test, lint, build, or release workflows change.
