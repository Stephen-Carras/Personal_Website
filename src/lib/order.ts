// Display order = order in the YAML file. Astro's file() loader returns entries sorted
// by id, so list collections (results, roles, recommendations, trips, education) are
// re-sorted here by the position of each `- id:` line in their data file.
import fs from 'node:fs';
import { getCollection, type CollectionKey } from 'astro:content';

const FILES: Partial<Record<CollectionKey, string>> = {
  results: 'src/data/results.yaml',
  roles: 'src/data/roles.yaml',
  recommendations: 'src/data/recommendations.yaml',
  trips: 'src/data/trips.yaml',
  education: 'src/data/education.yaml',
};

function idsInFile(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8');
  // Top-level list items only: "- id: x" or "- { id: x, ... }" at column 0.
  return [...text.matchAll(/^- (?:\{\s*)?id:\s*["']?([\w-]+)/gm)].map((m) => m[1]);
}

export async function inFileOrder<C extends CollectionKey>(name: C) {
  const entries = await getCollection(name);
  const file = FILES[name];
  if (!file) return entries;
  const ids = idsInFile(file);
  const pos = (id: string) => {
    const n = ids.indexOf(id);
    if (n < 0) throw new Error(`${file}: could not find "- id: ${id}" to order entries`);
    return n;
  };
  return entries.sort((a, b) => pos(a.id) - pos(b.id));
}
