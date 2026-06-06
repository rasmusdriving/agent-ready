# Changelog

All notable changes to AgentReady will be documented in this file.

## 0.1.0 - 2026-06-06

### Added

- Published npm package as `@rasmusdriving/agent-ready` with the `agent-ready` CLI binary.
- Initial TypeScript CLI.
- `agent-ready init` for generating `AGENTS.md`, `CONTRIBUTING.md`, PR template, workflow, and config files.
- `agent-ready check` for package-manager mismatch, stale command, missing file reference, and missing section validation.
- `agent-ready doctor` for readiness summaries.
- `agent-ready badge` for README badge snippets.
- `agent-ready bundle` for compact repo-context packets.
- Clearer documentation for current GitHub Actions usage and the future dedicated action path.
- More structured Markdown path-reference parsing with fewer false positives.
- First conservative Python scanner pass for `pyproject.toml`, `requirements.txt`, uv, Poetry, pip, pytest, Ruff, Black, and mypy.
- Node.js scanner for package manager, scripts, framework hints, docs, and monorepo markers.
- Vitest coverage for scanner, generator, and validator behavior.
