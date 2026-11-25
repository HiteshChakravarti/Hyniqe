import { createHash, randomUUID } from 'node:crypto';

export function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

export function now(): string {
  return new Date().toISOString();
}

/** Deterministic pseudo-random numbers, so demo weeks are repeatable. */
export function seeded(seed: string): () => number {
  let h = parseInt(createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) || 1;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length) % items.length]!;
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
