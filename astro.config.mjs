// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Allow Astro to download & optimize GitHub social-preview images at build
  // time, so visitors load them from our own domain (avoids GitHub rate limits).
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'repository-images.githubusercontent.com' },
      { protocol: 'https', hostname: 'opengraph.githubassets.com' }
    ]
  },
});
