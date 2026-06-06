import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export async function createTempRepo(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "agent-ready-"));
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeText(filePath: string, value: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value);
}
