// @ts-check
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// Project pictures (GitHub social previews and cards) are fetched at build time by src/lib/github.ts into .cache/og/,
// so visitors load them from our own domain. This serves that folder at /og/ in dev and copies it into the build.
const OG_DIR = '.cache/og';
/** @type {import('astro').AstroIntegration} */
const ogImages = {
  name: 'og-images',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use('/og', (req, res, next) => {
        const file = `${OG_DIR}/${(req.url ?? '').replace(/^\/+|\?.*$/g, '')}`;
        if (!/^[\w.-]+\.webp$/.test(file.slice(OG_DIR.length + 1)) || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/webp');
        res.end(readFileSync(file));
      });
    },
    'astro:build:done': ({ dir }) => {
      if (existsSync(OG_DIR)) cpSync(OG_DIR, fileURLToPath(new URL('og/', dir)), { recursive: true });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  integrations: [ogImages],
});
