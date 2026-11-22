// Maps a source-images/ file name to its imported asset (so astro:assets can resize it
// and strip EXIF) and to its alt text from image-manifest.json (the single source of alt text).
import type { ImageMetadata } from 'astro';
import { manifestEntries } from './image-files';

// Every source image is imported here; originals that no page uses are removed from
// dist/ by the prune-unused-assets hook in astro.config.mjs.
const modules = import.meta.glob<{ default: ImageMetadata }>('/source-images/*.{jpg,jpeg,png}', {
  eager: true,
});

const assets = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  assets.set(path.slice(path.lastIndexOf('/') + 1), mod.default);
}

const alts = new Map(
  manifestEntries.map((m) => [m.file.replace(/^source-images\//, ''), m.alt] as const),
);

export interface SiteImage {
  src: ImageMetadata;
  alt: string;
}

export function img(file: string): SiteImage {
  const src = assets.get(file);
  const alt = alts.get(file);
  if (!src) throw new Error(`Image not found in source-images/: ${file}`);
  if (alt === undefined) throw new Error(`Image missing from image-manifest.json: ${file}`);
  return { src, alt };
}
