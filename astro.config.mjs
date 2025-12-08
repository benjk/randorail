import { defineConfig } from 'astro/config';
import { VIDEO_CONFIG } from '../video/video-config.mjs';
import react from '@astrojs/react';

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
    domains: [new URL(VIDEO_CONFIG.globalCdnUrl).hostname],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(VIDEO_CONFIG.globalCdnUrl).hostname,
      },
    ],
  },
});
