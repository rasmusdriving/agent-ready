import { promises as fs } from "node:fs";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(filePath: string): Promise<string | undefined> {
  if (!(await pathExists(filePath))) {
    return undefined;
  }

  return fs.readFile(filePath, "utf8");
}

export async function readJsonIfExists<T>(filePath: string): Promise<T | undefined> {
  const content = await readTextIfExists(filePath);
  if (!content) {
    return undefined;
  }

  return JSON.parse(content) as T;
}

export async function writeFileCreatingDirs(
  filePath: string,
  content: string
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}
