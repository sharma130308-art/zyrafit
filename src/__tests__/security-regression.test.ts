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
 *
 * On failure, a structured artifact is written to
 * `artifacts/security-regression-offenders.json` (path overridable with
 * `SECURITY_ARTIFACT_PATH`) containing per-offender file, line, and matched
 * snippet so CI can upload it for inspection.
 */
import { afterAll, describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const ARTIFACT_PATH = process.env.SECURITY_ARTIFACT_PATH
  ? resolve(process.env.SECURITY_ARTIFACT_PATH)
  : resolve(ROOT, "artifacts/security-regression-offenders.json");

type Offender = {
  check: "debug-window-hooks" | "ai_usage-client-writes";
  file: string; // repo-relative
  line: number | null;
  snippet: string;
  message: string;
};

const collected: Offender[] = [];

function rel(p: string) {
  return relative(ROOT, p).split("\\").join("/");
}

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split("\n").length;
}

function snippetAt(src: string, index: number, span = 200): string {
  const start = Math.max(0, index - 40);
  return src.slice(start, Math.min(src.length, index + span)).replace(/\s+/g, " ").trim();
}

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

afterAll(() => {
  try {
    if (collected.length === 0) {
      // Remove any stale artifact from a previous failing run so green runs
      // don't leave misleading files behind.
      try { rmSync(ARTIFACT_PATH, { force: true }); } catch { /* ignore */ }
      return;
    }
    mkdirSync(dirname(ARTIFACT_PATH), { recursive: true });
    const payload = {
      generatedAt: new Date().toISOString(),
      totalOffenders: collected.length,
      offenders: collected,
    };
    writeFileSync(ARTIFACT_PATH, JSON.stringify(payload, null, 2), "utf8");
    // Surface the artifact path in CI logs.
    // eslint-disable-next-line no-console
    console.error(`[security-regression] wrote ${collected.length} offender(s) to ${ARTIFACT_PATH}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[security-regression] failed to write artifact:", err);
  }
});

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

      for (const m of hits) {
        const idx = m.index ?? 0;
        const start = Math.max(0, idx - 400);
        const window400 = src.slice(start, idx);
        if (!/import\.meta\.env\.DEV/.test(window400)) {
          const message = `${rel(file)}:${lineOf(src, idx)} \`${m[0]}\` is not guarded by import.meta.env.DEV`;
          offenders.push(message);
          collected.push({
            check: "debug-window-hooks",
            file: rel(file),
            line: lineOf(src, idx),
            snippet: snippetAt(src, idx),
            message,
          });
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("does not grant client INSERT/UPDATE/DELETE on public.ai_usage", () => {
    const migrationsDir = join(ROOT, "supabase", "migrations");
    const files = walk(migrationsDir, [".sql"]).sort(); // chronological by timestamp prefix
    const offenders: string[] = [];

    // Track the net set of surviving write policies on ai_usage across all
    // migrations. A CREATE POLICY adds; a DROP POLICY removes.
    type LiveEntry = { file: string; line: number; snippet: string };
    const liveWritePolicies = new Map<string, LiveEntry>();

    for (const file of files) {
      const raw = readFileSync(file, "utf8");
      const sql = raw
        .replace(/--.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");

      // Track per-statement offsets so we can report line numbers.
      let cursor = 0;
      for (const stmt of sql.split(";")) {
        const stmtStartInSql = cursor;
        cursor += stmt.length + 1; // +1 for the ";" we split on

        const createMatch = stmt.match(
          /create\s+policy\s+"([^"]+)"[\s\S]*?on\s+(?:public\.)?ai_usage\b[\s\S]*?for\s+(insert|update|delete)\b/i,
        );
        if (createMatch) {
          liveWritePolicies.set(createMatch[1], {
            file: rel(file),
            line: lineOf(sql, stmtStartInSql),
            snippet: stmt.replace(/\s+/g, " ").trim().slice(0, 280),
          });
        }

        const dropMatch = stmt.match(
          /drop\s+policy\s+(?:if\s+exists\s+)?"([^"]+)"\s+on\s+(?:public\.)?ai_usage\b/i,
        );
        if (dropMatch) liveWritePolicies.delete(dropMatch[1]);
      }

      // Broad GRANTs to anon/authenticated/public are always a regression.
      const grantRe =
        /grant\s+[^;]*\b(insert|update|delete)\b[^;]*on\s+(?:table\s+)?(?:public\.)?ai_usage[^;]*to\s+[^;]*\b(anon|authenticated|public)\b/gi;
      for (const g of sql.matchAll(grantRe)) {
        const idx = g.index ?? 0;
        const message = `${rel(file)}:${lineOf(sql, idx)} GRANT ${g[1].toUpperCase()} on ai_usage to ${g[2]} (server-only table)`;
        offenders.push(message);
        collected.push({
          check: "ai_usage-client-writes",
          file: rel(file),
          line: lineOf(sql, idx),
          snippet: g[0].replace(/\s+/g, " ").trim(),
          message,
        });
      }
    }

    for (const [name, entry] of liveWritePolicies) {
      const message = `${entry.file}:${entry.line} Surviving client write policy on public.ai_usage: "${name}" — ai_usage is server-only; drop the policy`;
      offenders.push(message);
      collected.push({
        check: "ai_usage-client-writes",
        file: entry.file,
        line: entry.line,
        snippet: entry.snippet,
        message,
      });
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
