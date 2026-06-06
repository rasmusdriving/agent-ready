# Security Policy

## Supported Versions

The latest published minor version receives security fixes.

## Reporting A Vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub private vulnerability reporting when available, or contact the maintainer directly through the email listed on the GitHub profile.

Include:

- A short description of the issue.
- Steps to reproduce.
- The affected version or commit.
- Any known impact.

## Security Principles

AgentReady should remain local-first:

- It must not send repository contents to external services.
- It must not collect telemetry by default.
- It must not execute arbitrary project scripts during scanning.
- It must not overwrite existing files without explicit user action.
