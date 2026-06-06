# Roadmap

AgentReady's first goal is to be useful to real maintainers before it becomes broad.

## Phase 0: Repo Foundation

- [x] Public-ready repository structure.
- [x] Apache-2.0 license.
- [x] TypeScript CLI setup.
- [x] Tests, linting, formatting, and CI.
- [x] Project governance files.

## Phase 1: Node.js MVP

- [x] Package-manager detection.
- [x] `package.json` script detection.
- [x] `AGENTS.md` generation.
- [x] `CONTRIBUTING.md` generation.
- [x] Pull request template generation.
- [x] Dry-run and safe write behavior.
- [x] Text, Markdown, and JSON check output.
- [ ] Interactive confirmation without `--yes`.
- [ ] Snapshot tests for generated Markdown.
- [ ] Configurable required sections.

## Phase 2: Validator Depth

- [x] Package-manager mismatch detection.
- [x] Stale script command detection.
- [x] Missing file reference detection.
- [x] Required `AGENTS.md` section checks.
- [ ] Contradictory instruction detection across docs.
- [ ] Safer Markdown path-reference parsing.
- [ ] Better monorepo workspace reporting.

## Phase 3: GitHub Action

- [x] CI workflow example.
- [x] Composite action metadata.
- [ ] Dedicated `agentready/agent-ready-action` repository or published action path.
- [ ] Example repo using the action publicly.
- [ ] Step summary examples in docs.

## Phase 4: Ecosystem Expansion

- [ ] Python support.
- [ ] Rust support.
- [ ] Go support.
- [ ] Nested `AGENTS.md` recommendations and generation.
- [ ] Template marketplace for common repo types.

## Phase 5: Optional AI-Assisted Features

- [ ] Optional repo-context bundle.
- [ ] Optional release-note drafting.
- [ ] Optional review-guidance suggestions.

AgentReady must continue to work without API keys or external AI services.
