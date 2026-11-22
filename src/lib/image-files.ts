// The list of usable image file names, read from source-images/image-manifest.json.
// The content schemas use it so a data file can only reference an image that exists
// in the manifest (and therefore has alt text).
import manifest from '../../source-images/image-manifest.json';

export interface ManifestEntry {
  file: string;
  alt: string;
  used_in: string;
}

export const manifestEntries = manifest as ManifestEntry[];

const names = manifestEntries.map((m) => m.file.replace(/^source-images\//, ''));
export const imageFiles = names as [string, ...string[]];
