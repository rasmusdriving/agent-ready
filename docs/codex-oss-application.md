# Codex For Open Source Application Packet

This packet summarizes the current application evidence for AgentReady.

## Project

- Repository: https://github.com/rasmusdriving/agent-ready
- Release: https://github.com/rasmusdriving/agent-ready/releases/tag/v0.1.0
- npm package: `@rasmusdriving/agent-ready`
- CLI binary: `agent-ready`
- License: Apache-2.0
- Role: Primary maintainer

## Current Evidence

- Public GitHub repository with release history.
- Issue-backed development and merged PR trail.
- CI and AgentReady self-check workflows passing.
- Public npm publish accepted for `@rasmusdriving/agent-ready@0.1.0`.
- npm dist-tag endpoint reports `latest: 0.1.0`.
- npm access status reports the package as public.
- Direct public tarball install works:

```bash
npm install https://registry.npmjs.org/@rasmusdriving/agent-ready/-/agent-ready-0.1.0.tgz
npx agent-ready badge
```

Note: at release time, the npm package document endpoint still returned 404 while the dist-tag and tarball endpoints were live. Recheck before submitting.

## Draft Answers

### Why does this repository qualify? 500 characters max

AgentReady is a local-first OSS CLI that helps maintainers create and validate AGENTS.md, CONTRIBUTING.md, PR templates, and repo-context packets for coding agents and human contributors. It already ships with CI, tests, issue-backed PRs, npm release, Node.js support, first Python detection, and self-validation on its own repo.

### How will you use API credits for your project? 500 characters max

Use credits to dogfood Codex on real maintainer workflows: PR review, issue triage, release-note drafting, regression-test generation, ecosystem scanner expansion, and validation of generated AGENTS.md guidance across example repos. AgentReady remains local-first; API use would support maintainer automation and optional future workflows, not required scanning.

### Anything else we should know? 500 characters max

AgentReady was built in public from a PRD focused on a real maintainer pain: contributor and agent instructions drift from repo reality. The project avoids telemetry and API requirements, includes AGENTS.md review guidance, and treats agent-readiness docs as testable artifacts rather than static templates.

## Submission Checklist

- [ ] Confirm npm package is visible through `npm view @rasmusdriving/agent-ready version`.
- [ ] Confirm clean install works with `npm install @rasmusdriving/agent-ready`.
- [ ] Confirm latest GitHub CI and AgentReady workflows are green.
- [ ] Confirm GitHub profile visibility is public.
- [ ] Gather OpenAI Organization ID from platform settings.
- [ ] Submit form: https://openai.com/form/codex-for-oss/
