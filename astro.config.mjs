// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Astro copies the original of every imported image into dist/_astro, even when only
 * resized copies are used on the page. Originals can carry EXIF/GPS metadata, so this
 * hook deletes any image in dist/_astro that no HTML, CSS or JS file references.
 * scripts/check-dist.mjs then verifies nothing unreferenced or metadata-bearing is left.
 * @returns {import('astro').AstroIntegration}
 */
function pruneUnusedAssets() {
  return {
    name: 'prune-unused-assets',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const walk = (d) =>
          fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
            const p = path.join(d, e.name);
            return e.isDirectory() ? walk(p) : [p];
          });
        const all = walk(root);
        const refs = all
          .filter((f) => /\.(html|css|js)$/.test(f))
          .map((f) => fs.readFileSync(f, 'utf8'))
          .join('\n');
        const removed = all
          .filter((f) => f.includes(`${path.sep}_astro${path.sep}`))
          .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
          .filter((f) => !refs.includes(path.basename(f)));
        removed.forEach((f) => fs.rmSync(f));
        if (removed.length) logger.info(`removed ${removed.length} unreferenced original image(s)`);
      },
    },
  };
}

// Static output only. Nothing may be inlined into the HTML: the CSP allows only
// same-origin scripts and styles (no 'unsafe-inline'), so every stylesheet, script
// and asset must be an external file.
export default defineConfig({
  output: 'static',
  // The site's public URL: used for the canonical link, share tags, structured data
  // and security.txt. Change this one line when a custom domain is chosen.
  site: 'https://stephencarras.com',
  build: {
    inlineStylesheets: 'never',
  },
  devToolbar: { enabled: false },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  integrations: [pruneUnusedAssets()],
});
