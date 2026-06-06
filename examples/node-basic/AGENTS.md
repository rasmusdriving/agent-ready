# AGENTS.md

## Project overview

This is a minimal Node.js example showing AgentReady's generated instruction style.

## Repository layout

- `package.json` defines the example scripts.
- `.agent-ready/config.json` shows the validation config AgentReady creates.

## Setup

Use npm:

```bash
npm install
```

## Development commands

```bash
npm run build
```

## Testing

```bash
npm test
```

## Linting and formatting

```bash
npm run lint
```

## Pull request expectations

Before opening a PR:

1. Run `npm test`.
2. Run `npm run lint`.
3. Update docs when commands change.

## Review guidelines

Focus review on command drift, stale docs, and generated guidance quality.

## Files and directories to avoid editing casually

- `node_modules/` and build outputs are generated.

## Security and privacy notes

Do not add telemetry or external code upload behavior to this example.

## Maintainer notes

This example should remain intentionally small.
