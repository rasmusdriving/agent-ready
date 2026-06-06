import path from "node:path";
import { pathExists, readTextIfExists } from "./fs.js";
import type { CommandKind, PackageManager, PythonProjectData } from "./types.js";

const pythonFiles = [
  "pyproject.toml",
  "requirements.txt",
  "requirements-dev.txt",
  "uv.lock",
  "poetry.lock",
  "Pipfile",
  "setup.py"
];

const toolPatterns: Array<[string, RegExp]> = [
  ["pytest", /\bpytest\b|\[tool\.pytest\b/],
  ["ruff", /\bruff\b|\[tool\.ruff\b/],
  ["black", /\bblack\b|\[tool\.black\b/],
  ["mypy", /\bmypy\b|\[tool\.mypy\b/],
  ["poetry", /\[tool\.poetry\b/],
  ["uv", /\[tool\.uv\b/]
];

export async function detectPythonProject(
  root: string
): Promise<PythonProjectData | undefined> {
  const files = await detectPythonFiles(root);
  if (files.length === 0) {
    return undefined;
  }

  const pyproject = await readTextIfExists(path.join(root, "pyproject.toml"));
  const requirements = await readRequirements(root);
  const text = [pyproject, requirements].filter(Boolean).join("\n");

  return {
    name: pyproject ? readTomlString(pyproject, "name") : undefined,
    description: pyproject ? readTomlString(pyproject, "description") : undefined,
    files,
    tools: detectTools(text)
  };
}

export function detectPythonPackageManager(project: PythonProjectData): PackageManager {
  if (project.files.includes("uv.lock") || project.tools.includes("uv")) {
    return "uv";
  }

  if (project.files.includes("poetry.lock") || project.tools.includes("poetry")) {
    return "poetry";
  }

  return "pip";
}

export function detectPythonCommands(
  manager: PackageManager,
  project: PythonProjectData
): Partial<Record<CommandKind, string>> {
  const commands: Partial<Record<CommandKind, string>> = {
    install: installCommand(manager, project)
  };
  const prefix = runPrefix(manager);

  if (project.tools.includes("pytest")) {
    commands.test = `${prefix}pytest`;
  }

  if (project.tools.includes("ruff")) {
    commands.lint = `${prefix}ruff check .`;
  }

  if (project.tools.includes("black")) {
    commands.format = `${prefix}black --check .`;
  }

  if (project.tools.includes("mypy")) {
    commands.typecheck = `${prefix}mypy .`;
  }

  return commands;
}

async function detectPythonFiles(root: string): Promise<string[]> {
  const found: string[] = [];

  for (const file of pythonFiles) {
    if (await pathExists(path.join(root, file))) {
      found.push(file);
    }
  }

  return found;
}

async function readRequirements(root: string): Promise<string> {
  const requirements = await readTextIfExists(path.join(root, "requirements.txt"));
  const devRequirements = await readTextIfExists(path.join(root, "requirements-dev.txt"));
  return [requirements, devRequirements].filter(Boolean).join("\n");
}

function detectTools(content: string): string[] {
  return toolPatterns.filter(([, pattern]) => pattern.test(content)).map(([tool]) => tool);
}

function readTomlString(content: string, key: "name" | "description"): string | undefined {
  const match = content.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']`, "m"));
  return match?.[1];
}

function installCommand(manager: PackageManager, project: PythonProjectData): string {
  if (manager === "uv") {
    return "uv sync";
  }

  if (manager === "poetry") {
    return "poetry install";
  }

  if (project.files.includes("requirements.txt")) {
    return "python -m pip install -r requirements.txt";
  }

  return "python -m pip install -e .";
}

function runPrefix(manager: PackageManager): string {
  if (manager === "uv") {
    return "uv run ";
  }

  if (manager === "poetry") {
    return "poetry run ";
  }

  return "python -m ";
}
