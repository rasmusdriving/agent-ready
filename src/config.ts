import path from "node:path";
import { readJsonIfExists } from "./fs.js";
import type { AgentProfile, CommandKind, RepoScan } from "./types.js";

export interface AgentReadyConfig {
  $schema?: string;
  version: number;
  profile: AgentProfile;
  mode: "warn" | "fail";
  commands: Partial<Record<CommandKind, string>>;
  docs: {
    agents: string;
    contributing: string;
    prTemplate: string;
  };
  rules: {
    requireAgentsMd: boolean;
    requireContributing: boolean;
    requirePrTemplate: boolean;
    checkPackageManagerMismatch: boolean;
    checkMissingScripts: boolean;
    checkMissingFileReferences: boolean;
  };
}

export function defaultConfig(
  scan: RepoScan,
  profile: AgentProfile = "generic"
): AgentReadyConfig {
  return {
    $schema: "https://agentready.dev/schema.json",
    version: 1,
    profile,
    mode: "warn",
    commands: scan.commands,
    docs: {
      agents: "AGENTS.md",
      contributing: "CONTRIBUTING.md",
      prTemplate: ".github/pull_request_template.md"
    },
    rules: {
      requireAgentsMd: true,
      requireContributing: false,
      requirePrTemplate: false,
      checkPackageManagerMismatch: true,
      checkMissingScripts: true,
      checkMissingFileReferences: true
    }
  };
}

export async function loadConfig(
  root: string,
  configPath?: string
): Promise<AgentReadyConfig | undefined> {
  const resolved = path.resolve(root, configPath ?? ".agent-ready/config.json");
  return readJsonIfExists<AgentReadyConfig>(resolved);
}
