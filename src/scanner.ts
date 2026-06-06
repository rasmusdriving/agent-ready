import { promises as fs } from "node:fs";
import path from "node:path";
import { pathExists, readJsonIfExists } from "./fs.js";
import {
  detectPythonCommands,
  detectPythonPackageManager,
  detectPythonProject
} from "./python.js";
import type { CommandKind, PackageJsonData, PackageManager, RepoScan } from "./types.js";

const lockfileManagers: Array<[string, PackageManager]> = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["package-lock.json", "npm"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"]
];

const scriptKinds: CommandKind[] = ["test", "lint", "build", "format", "typecheck", "dev"];

const frameworkNames = [
  "next",
  "vite",
  "react",
  "vue",
  "svelte",
  "astro",
  "express",
  "fastify",
  "@nestjs/core",
  "vitest",
  "jest",
  "@playwright/test",
  "eslint",
  "prettier",
  "typescript",
  "tsup",
  "rollup"
];

export async function scanRepo(root: string): Promise<RepoScan> {
  const packageJson = await readJsonIfExists<Partial<PackageJsonData>>(
    path.join(root, "package.json")
  );
  const normalizedPackageJson = normalizePackageJson(packageJson);
  const python = await detectPythonProject(root);
  const lockfiles = await detectLockfiles(root);
  const ecosystem = normalizedPackageJson ? "node" : python ? "python" : "generic";
  const packageManager = normalizedPackageJson
    ? detectPackageManager(lockfiles)
    : python
      ? detectPythonPackageManager(python)
      : "unknown";
  const scripts = normalizedPackageJson?.scripts ?? {};
  const commands = normalizedPackageJson
    ? detectCommands(packageManager, scripts)
    : python
      ? detectPythonCommands(packageManager, python)
      : {};
  const monorepo = await detectMonorepo(root, normalizedPackageJson);
  const existingDocs = await detectExistingDocs(root);
  const frameworks = detectFrameworks(normalizedPackageJson);

  return {
    root,
    ecosystem,
    packageJson: normalizedPackageJson,
    python,
    packageManager,
    lockfiles,
    scripts,
    commands,
    frameworks,
    monorepo,
    existingDocs
  };
}

export function detectCommands(
  packageManager: PackageManager,
  scripts: Record<string, string>
): Partial<Record<CommandKind, string>> {
  const commandPrefix = packageManager === "unknown" ? "npm" : packageManager;
  const commands: Partial<Record<CommandKind, string>> = {
    install: `${commandPrefix} install`
  };

  for (const kind of scriptKinds) {
    if (scripts[kind]) {
      commands[kind] = scriptCommand(commandPrefix, kind);
    }
  }

  return commands;
}

function scriptCommand(
  packageManager: Exclude<PackageManager, "unknown"> | "npm",
  kind: CommandKind
): string {
  if (packageManager === "npm") {
    return kind === "test" ? "npm test" : `npm run ${kind}`;
  }

  if (packageManager === "bun" && kind !== "test") {
    return `bun run ${kind}`;
  }

  return `${packageManager} ${kind}`;
}

async function detectLockfiles(root: string): Promise<string[]> {
  const found: string[] = [];

  for (const [file] of lockfileManagers) {
    if (await pathExists(path.join(root, file))) {
      found.push(file);
    }
  }

  return found;
}

function detectPackageManager(lockfiles: string[]): PackageManager {
  for (const [file, manager] of lockfileManagers) {
    if (lockfiles.includes(file)) {
      return manager;
    }
  }

  return "npm";
}

async function detectMonorepo(root: string, packageJson?: PackageJsonData) {
  const markers: string[] = [];
  const workspaceGlobs = extractWorkspaceGlobs(packageJson);

  for (const marker of [
    "pnpm-workspace.yaml",
    "turbo.json",
    "nx.json",
    "lerna.json",
    "rush.json"
  ]) {
    if (await pathExists(path.join(root, marker))) {
      markers.push(marker);
    }
  }

  for (const directory of ["packages", "apps"]) {
    if (await hasChildDirectory(path.join(root, directory))) {
      markers.push(`${directory}/*`);
      workspaceGlobs.push(`${directory}/*`);
    }
  }

  if (workspaceGlobs.length > 0) {
    markers.push("package.json workspaces");
  }

  return {
    detected: markers.length > 0,
    markers: [...new Set(markers)],
    workspaceGlobs: [...new Set(workspaceGlobs)]
  };
}

async function hasChildDirectory(directory: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries.some((entry) => entry.isDirectory());
  } catch {
    return false;
  }
}

async function detectExistingDocs(root: string): Promise<string[]> {
  const docs = [
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    ".github/pull_request_template.md"
  ];
  const found: string[] = [];

  for (const doc of docs) {
    if (await pathExists(path.join(root, doc))) {
      found.push(doc);
    }
  }

  return found;
}

function detectFrameworks(packageJson?: PackageJsonData): string[] {
  const deps = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {})
  };

  return frameworkNames.filter((name) => deps[name]);
}

function extractWorkspaceGlobs(packageJson?: PackageJsonData): string[] {
  const workspaces = packageJson?.workspaces;
  if (Array.isArray(workspaces)) {
    return workspaces;
  }

  return workspaces?.packages ?? [];
}

function normalizePackageJson(
  packageJson?: Partial<PackageJsonData>
): PackageJsonData | undefined {
  if (!packageJson) {
    return undefined;
  }

  return {
    name: packageJson.name,
    description: packageJson.description,
    scripts: packageJson.scripts ?? {},
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
    workspaces: packageJson.workspaces
  };
}
