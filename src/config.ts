export const SITE_TITLE = 'Site créé par BENKI';
export const SITE_LANG = 'fr';
export const META_DESCRIPTION =
  'Voici le meilleur site Astro généré par un CLI énervé.';
export const META_SITE_URL = 'https://rando.benkielinski.fr/';

// OPENGRAPH
export const META_OG_TITLE = 'Mon Site - BENKI Création';
export const META_OG_DESCRIPTION =
  "Cette description sera affiché dans l'aperçu de votre site.";
export const META_OG_SITENAME = 'benkielinski.fr';
export const META_OG_URL_IMG = META_SITE_URL + 'img/og/og-img.jpg';
export const META_OG_URL_IMG_SQUARE =
  META_SITE_URL + 'img/og/og-img-square.jpg';
export const META_OG_IMG_WIDTH = '1200';
export const META_OG_IMG_HEIGHT = '629';
export const META_OG_IMG_SQUARE_WIDTH = '883';
export const META_OG_IMG_SQUARE_HEIGHT = '883';

// IMAGES
export const IMG_PUBLIC_FOLDER = '/img/';

// Google
export const GOOGLE_MAP_URL =
  'https://www.google.com/maps/dir/?api=1&destination=le+rando-rail+et+Trotti-trail+du+Pays+de+LUMBRES';

// --- VIDEO ---
const globalCdnUrl = 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev';
export const VIDEO_CONFIG = {
  globalCdnUrl: globalCdnUrl,

  // --- VIDEOS ---
  sdMp4: `${globalCdnUrl}/video-hero-sd.mp4`,
  sdWebm: `${globalCdnUrl}/video-hero-sd.webm`,

  hdMp4: `${globalCdnUrl}/video-hero-hd.mp4`,
  hdWebm: `${globalCdnUrl}/video-hero-hd.webm`,

  uhdWebm: `${globalCdnUrl}/video-hero-uhd.webm`,

  speedTestVideo: `${globalCdnUrl}/video-hero-speedtest.mp4`,

  // --- POSTERS ---
  posters: {
    mobile: {
      avif: `${globalCdnUrl}/video-hero-poster-mobile.avif`,
      webp: `${globalCdnUrl}/video-hero-poster-mobile.webp`,
    },
    tablet: {
      avif: `${globalCdnUrl}/video-hero-poster-tablet.avif`,
      webp: `${globalCdnUrl}/video-hero-poster-tablet.webp`,
    },
    desktop: {
      avif: `${globalCdnUrl}/video-hero-poster-desktop.avif`,
      webp: `${globalCdnUrl}/video-hero-poster-desktop.webp`,
    },
  },

  posterBlurBase64:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAiACHAAD//gAQTGF2YzYxLjMzLjEwMgD/2wBDAAg+Pkk+SVVVVVVVVWRdZGhoaGRkZGRoaGhwcHCDg4NwcHBoaHBwfHyDg4+Tj4eHg4eTk5ubm7q6srLZ2eD/////xABeAAEBAQEAAAAAAAAAAAAAAAAFBAIGAQADAQEAAAAAAAAAAAAAAAAEAQMAAhAAAgEEAgMBAAAAAAAAAAAAAAECMnGRETFREhMDQhEBAQAAAAAAAAAAAAAAAAAAABH/wAARCAARAB4DASIAAhEAAxEA/9oADAMBAAIRAxEAPwDjPZJ/p5YzH6STqeQ/WumY0ugSpmPO+SNt95Ya9IKM6Oqp2KCdVOxQRJFPkGGZ8gwQb//Z',
  // --- CONFIG ---
  fallbackUrl: `${globalCdnUrl}/video-hero-hd.webm`,
  BREAKPOINTS: {
    mobile: 740,
    tablet: 992,
  },
} as const;
