// Load a GeoNames cities file when HYNIQE_GEONAMES points at one
// (e.g. cities15000.txt from https://download.geonames.org/export/dump/).
import { existsSync, readFileSync } from 'node:fs';
import { loadGeoNames, gazetteerSize } from './gazetteer.ts';

let loaded: string | null = null;

export function useGeoNamesIfConfigured(): string | null {
  if (loaded) return loaded;
  const path = process.env.HYNIQE_GEONAMES;
  if (!path) return null;
  if (!existsSync(path)) throw new Error(`HYNIQE_GEONAMES points at ${path}, which does not exist`);
  const added = loadGeoNames(readFileSync(path, 'utf8'));
  loaded = `GeoNames: ${added} place names added from ${path} (${gazetteerSize().names} total)`;
  return loaded;
}
