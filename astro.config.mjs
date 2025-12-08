import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Doublon avec config
const globalCdnUrl = 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev';

export default defineConfig({
  integrations: [react()],
  vite: {
    build: {
      rollupOptions: {
        external: ['/favicon.svg'],
      },
    },
  },
  image: {
    domains: [new URL(globalCdnUrl).hostname],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(globalCdnUrl).hostname,
      },
    ],
  },
});
