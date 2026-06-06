export interface MarkdownPathReferenceOptions {
  localPrefixes?: string[];
}

const defaultLocalPrefixes = new Set([
  ".agent-ready",
  ".github",
  "app",
  "apps",
  "bin",
  "docs",
  "examples",
  "fixtures",
  "lib",
  "packages",
  "scripts",
  "src",
  "test",
  "tests"
]);

const fileExtensionPattern = /\.[A-Za-z0-9]{1,12}$/;

export function extractMarkdownPathReferences(
  content: string,
  options: MarkdownPathReferenceOptions = {}
): string[] {
  const references = new Set<string>();
  const linkContent = stripFencedCodeBlocks(content);
  const localPrefixes = new Set(options.localPrefixes ?? defaultLocalPrefixes);

  for (const value of extractMarkdownLinkDestinations(linkContent)) {
    addReference(references, value, "link", localPrefixes);
  }

  for (const value of extractInlineCodeValues(linkContent)) {
    addReference(references, value, "inline-code", localPrefixes);
  }

  return [...references];
}

function extractMarkdownLinkDestinations(content: string): string[] {
  const destinations: string[] = [];
  const links = content.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g);

  for (const link of links) {
    const destination = normalizeLinkDestination(link[1]);
    if (destination) {
      destinations.push(destination);
    }
  }

  return destinations;
}

function normalizeLinkDestination(rawValue: string): string {
  const value = rawValue.trim();
  if (value.startsWith("<")) {
    const endIndex = value.indexOf(">");
    return endIndex > 0 ? value.slice(1, endIndex).trim() : "";
  }

  return value.split(/\s+/)[0]?.trim() ?? "";
}

function extractInlineCodeValues(content: string): string[] {
  return [...content.matchAll(/`([^`\n]+)`/g)].map((match) => match[1].trim());
}

function addReference(
  references: Set<string>,
  rawValue: string,
  source: "link" | "inline-code",
  localPrefixes: Set<string>
): void {
  const value = normalizeCandidate(rawValue);
  if (!value || shouldIgnoreCandidate(value)) {
    return;
  }

  if (source === "inline-code" && !isLikelyInlinePath(value, localPrefixes)) {
    return;
  }

  references.add(value);
}

function normalizeCandidate(rawValue: string): string {
  return rawValue
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .split("#")[0]
    .split("?")[0]
    .replace(/^\.\//, "")
    .replace(/^\//, "");
}

function shouldIgnoreCandidate(value: string): boolean {
  return (
    value === "" ||
    value.startsWith("#") ||
    value.startsWith("../") ||
    value.startsWith("//") ||
    value.includes(" ") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)
  );
}

function isLikelyInlinePath(value: string, localPrefixes: Set<string>): boolean {
  if (fileExtensionPattern.test(value)) {
    return true;
  }

  if (!value.includes("/")) {
    return false;
  }

  const firstSegment = value.split("/")[0];
  return localPrefixes.has(firstSegment);
}

function stripFencedCodeBlocks(content: string): string {
  return content.replace(/```[\s\S]*?```/g, "");
}
