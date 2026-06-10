// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  // Allow Astro to download & optimize GitHub social-preview images at build
  // time, so visitors load them from our own domain (avoids GitHub rate limits).
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'repository-images.githubusercontent.com' },
      { protocol: 'https', hostname: 'opengraph.githubassets.com' }
    ]
  },

  integrations: [preact()]
});