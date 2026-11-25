// Local JSON storage: one file per company. Simple, inspectable, no database.

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Company } from './types.ts';

export class Store {
  readonly dir: string;
  private cache = new Map<string, Company>();

  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  list(): Company[] {
    return readdirSync(this.dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => this.get(f.slice(0, -5)))
      .filter((c): c is Company => !!c)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get(id: string): Company | undefined {
    if (!/^[a-z0-9_-]+$/i.test(id)) return undefined;
    const hit = this.cache.get(id);
    if (hit) return hit;
    const file = join(this.dir, `${id}.json`);
    if (!existsSync(file)) return undefined;
    const c = JSON.parse(readFileSync(file, 'utf8')) as Company;
    this.cache.set(id, c);
    return c;
  }

  save(c: Company): void {
    this.cache.set(c.id, c);
    const file = join(this.dir, `${c.id}.json`);
    writeFileSync(`${file}.tmp`, JSON.stringify(c, null, 2));
    renameSync(`${file}.tmp`, file);
  }

  remove(id: string): void {
    this.cache.delete(id);
    rmSync(join(this.dir, `${id}.json`), { force: true });
  }

  clear(): void {
    for (const c of this.list()) this.remove(c.id);
  }
}
