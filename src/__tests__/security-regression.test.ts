/**
 * Security regression test.
 *
 * Fails the build if either of these previously-fixed issues is reintroduced:
 *   1. Debug window hooks (`window.showScanDebug` / `window.hideScanDebug`)
 *      exposed unconditionally — must stay gated behind `import.meta.env.DEV`.
 *   2. A client-writable RLS policy on `public.ai_usage` (INSERT/UPDATE/DELETE)
 *      — `ai_usage` is server-only; only the service role may write.
 *
 * Run as part of `vitest` in CI. If this test fails, do NOT relax it — fix
 * the regression in the offending file/migration.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

function walk(dir: string, exts: string[], acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".output" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, exts, acc);
    else if (exts.some((e) => full.endsWith(e))) acc.push(full);
  }
  return acc;
}

describe("security regressions", () => {
  it("does not expose window.showScanDebug / hideScanDebug outside DEV guards", () => {
    const files = walk(join(ROOT, "src"), [".ts", ".tsx"]);
    const offenders: string[] = [];

    for (const file of files) {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      const src = readFileSync(file, "utf8");
      const hits = [
        ...src.matchAll(/window\.(showScanDebug|hideScanDebug)\s*=/g),
      ];
      if (hits.length === 0) continue;

      // Each assignment must appear inside an `import.meta.env.DEV` guard.
      // We require the file to contain a DEV check AND each assignment to be
      // textually preceded (within 400 chars) by an `import.meta.env.DEV` token.
      for (const m of hits) {
        const start = Math.max(0, (m.index ?? 0) - 400);
        const window400 = src.slice(start, m.index);
        if (!/import\.meta\.env\.DEV/.test(window400)) {
          offenders.push(`${file}: \`${m[0]}\` is not guarded by import.meta.env.DEV`);
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("does not grant client INSERT/UPDATE/DELETE on public.ai_usage", () => {
    const migrationsDir = join(ROOT, "supabase", "migrations");
    const files = walk(migrationsDir, [".sql"]);
    const offenders: string[] = [];

    for (const file of files) {
      const sql = readFileSync(file, "utf8");
      // Strip comments to avoid false positives.
      const stripped = sql
        .replace(/--.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

      // Look for CREATE POLICY blocks targeting ai_usage with a write command.
      const policyRegex =
        /create\s+policy[\s\S]*?on\s+(?:public\.)?ai_usage[\s\S]*?for\s+(insert|update|delete)/gi;
      const matches = [...stripped.matchAll(policyRegex)];

      for (const m of matches) {
        // Allow the policy only if it is dropped later in the same file.
        // Cheap check: ensure there's no surviving CREATE POLICY for write ops
        // that isn't followed by a DROP POLICY for the same name.
        // For safety, just flag any CREATE POLICY for write on ai_usage —
        // server-only writes go through the service role and need no policy.
        offenders.push(
          `${file}: CREATE POLICY for ${m[1].toUpperCase()} on ai_usage (server-only table — no client write policy allowed)`,
        );
      }

      // Also flag broad GRANT INSERT/UPDATE/DELETE on ai_usage to anon/authenticated.
      const grantRegex =
        /grant\s+[^;]*\b(insert|update|delete)\b[^;]*on\s+(?:table\s+)?(?:public\.)?ai_usage[^;]*to\s+[^;]*\b(anon|authenticated|public)\b/gi;
      for (const g of stripped.matchAll(grantRegex)) {
        offenders.push(
          `${file}: GRANT ${g[1].toUpperCase()} on ai_usage to ${g[2]} (server-only table)`,
        );
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
