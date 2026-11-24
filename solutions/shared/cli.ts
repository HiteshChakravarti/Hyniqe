// Tiny argument parser + file helpers for the Node CLIs (not used in the browser).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function parseArgs(argv: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=", 2);
      if (v !== undefined) flags[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) flags[k] = argv[++i];
      else flags[k] = "true";
    } else positional.push(a);
  }
  return { flags, positional };
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function writeOutputs(dir: string | undefined, files: Record<string, string>): string[] {
  if (!dir) return [];
  mkdirSync(dir, { recursive: true });
  return Object.entries(files).map(([name, content]) => {
    const p = join(dir, name);
    writeFileSync(p, content);
    return p;
  });
}

export function fail(msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(2);
}
