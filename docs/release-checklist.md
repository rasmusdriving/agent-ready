# Release Checklist

Use this checklist for npm and GitHub releases.

## Before Release

1. Confirm the worktree is clean.
2. Review open issues and pull requests for release blockers.
3. Update `CHANGELOG.md` with the release date and notable changes.
4. Bump `package.json` and `package-lock.json` to the target version.
5. Run the full verification suite:

```bash
npm run check
```

6. Confirm AgentReady validates its own repo:

```bash
node dist/cli.js check
node dist/cli.js doctor
```

7. Confirm the npm package shape:

```bash
npm publish --dry-run --access public
```

## Publish

Local publishing requires npm authentication:

```bash
npm whoami
```

If that fails, log in with npm before continuing. In CI, configure `NPM_TOKEN` as a repository secret and use the release workflow.

When authentication is ready, publish:

```bash
npm publish --access public
```

## GitHub Release

1. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

2. Create a GitHub release from the tag.
3. Include the changelog section in the release notes.
4. Confirm release workflow status if publishing from GitHub Actions.

## Post-Release Smoke Test

Create a temporary project and verify the public package works:

```bash
mkdir /tmp/agent-ready-smoke
cd /tmp/agent-ready-smoke
npm init -y
npx @rasmusdriving/agent-ready init --dry-run
npx @rasmusdriving/agent-ready badge
```

Then verify the published package metadata:

```bash
npm view @rasmusdriving/agent-ready version
```

## After Release

- Close release tracking issues.
- Update roadmap checkboxes when relevant.
- Announce the release with a concise changelog and example commands.
- Watch for install or CLI bug reports.
