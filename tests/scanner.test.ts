import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepo } from "../src/scanner.js";
import { createTempRepo, writeJson, writeText } from "./helpers.js";

describe("scanRepo", () => {
  it("detects pnpm and package scripts", async () => {
    const root = await createTempRepo();
    await writeText(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        test: "vitest run",
        lint: "eslint .",
        build: "tsc"
      },
      devDependencies: {
        vitest: "^4.0.0",
        typescript: "^5.0.0"
      }
    });

    const scan = await scanRepo(root);

    expect(scan.packageManager).toBe("pnpm");
    expect(scan.commands.test).toBe("pnpm test");
    expect(scan.commands.lint).toBe("pnpm lint");
    expect(scan.commands.build).toBe("pnpm build");
    expect(scan.frameworks).toEqual(expect.arrayContaining(["vitest", "typescript"]));
  });

  it("detects monorepo markers", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      workspaces: ["packages/*"]
    });

    const scan = await scanRepo(root);

    expect(scan.monorepo.detected).toBe(true);
    expect(scan.monorepo.workspaceGlobs).toContain("packages/*");
  });

  it("uses npm run for npm scripts that need it", async () => {
    const root = await createTempRepo();
    await writeJson(path.join(root, "package.json"), {
      scripts: {
        test: "vitest run",
        lint: "eslint .",
        build: "tsc"
      }
    });

    const scan = await scanRepo(root);

    expect(scan.commands.test).toBe("npm test");
    expect(scan.commands.lint).toBe("npm run lint");
    expect(scan.commands.build).toBe("npm run build");
  });
});
