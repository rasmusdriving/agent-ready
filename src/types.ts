export type Ecosystem = "node" | "python" | "generic";

export type PackageManager =
  | "npm"
  | "pnpm"
  | "yarn"
  | "bun"
  | "uv"
  | "poetry"
  | "pip"
  | "unknown";

export type OutputFormat = "text" | "json" | "markdown";

export type AgentProfile = "generic" | "codex";

export interface PackageJsonData {
  name?: string;
  description?: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
}

export interface RepoScan {
  root: string;
  ecosystem: Ecosystem;
  packageJson?: PackageJsonData;
  python?: PythonProjectData;
  packageManager: PackageManager;
  lockfiles: string[];
  scripts: Record<string, string>;
  commands: Partial<Record<CommandKind, string>>;
  frameworks: string[];
  monorepo: MonorepoInfo;
  existingDocs: string[];
}

export interface PythonProjectData {
  name?: string;
  description?: string;
  files: string[];
  tools: string[];
}

export interface MonorepoInfo {
  detected: boolean;
  markers: string[];
  workspaceGlobs: string[];
}

export type CommandKind =
  | "install"
  | "test"
  | "lint"
  | "build"
  | "format"
  | "typecheck"
  | "dev";

export interface FileProposal {
  path: string;
  content: string;
  action: "create" | "skip-existing";
}

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  category:
    | "missing-command"
    | "stale-command"
    | "package-manager-mismatch"
    | "missing-file-reference"
    | "missing-section"
    | "conflicting-instruction"
    | "unsafe-review-guidance"
    | "unsupported-ecosystem";
  severity: IssueSeverity;
  file?: string;
  message: string;
  suggestion: string;
}
