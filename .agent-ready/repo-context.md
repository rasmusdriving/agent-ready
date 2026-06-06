# AgentReady Repo Context

## Project

- Name: @rasmusdriving/agent-ready
- Ecosystem: Node.js
- Package manager: npm
- Framework hints: vitest, eslint, prettier, typescript

Make your repository easier for AI coding agents and human contributors to work on.

## Commands

- install: `npm install`
- test: `npm test`
- lint: `npm run lint`
- build: `npm run build`
- format: `npm run format`
- dev: `npm run dev`

## Known Instruction Files

- README.md
- AGENTS.md
- CONTRIBUTING.md
- .github/pull_request_template.md

## Top-Level Layout

- .agent-ready/
- .github/
- .gitignore
- .prettierrc.json
- action.yml
- AGENTS.md
- CHANGELOG.md
- CODE_OF_CONDUCT.md
- CONTRIBUTING.md
- docs/
- eslint.config.js
- examples/
- LICENSE
- package.json
- README.md
- ROADMAP.md
- scripts/
- SECURITY.md
- src/
- tests/
- tsconfig.json

## Workflows

- .github/workflows/agent-ready.yml
- .github/workflows/ci.yml
- .github/workflows/release.yml

## Agent Guardrails

- Prefer the commands listed above when verifying changes.
- Keep generated files and dependencies out of manual edits.
- Update instruction docs when package-manager, test, lint, build, or release workflows change.
