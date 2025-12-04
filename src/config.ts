export const SITE_TITLE = 'Site créé par BENKI';
export const SITE_LANG = 'fr';
export const META_DESCRIPTION =
  'Voici le meilleur site Astro généré par un CLI énervé.';
export const META_SITE_URL = 'https://ucbk.benkielinski.fr/';

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

// VIDEO
export const VIDEO_CONFIG = {
  globalCdnUrl: 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev',
  desktopWebm: 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev/video-desktop.webm',
  desktopMp4: 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev/video-desktop.mp4',
  mobileWebm: 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev/video-mobile.webm',
  mobileMp4: 'https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev/video-mobile.mp4',
  posterUrl: `https://pub-ca5bf3a17c594a06b80231f68df0f27c.r2.dev/video-poster.webp`,
  posterBlurBase64:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAALAAtAAD//gAQTGF2YzYxLjMzLjEwMgD/2wBDAAgUFBcUFxsbGxsbGyAeICEhISAgICAhISEkJCQqKiokJCQhISQkKCgqKi4vLisrKisvLzIyMjw8OTlGRkhWVmf/xABlAAACAwEAAAAAAAAAAAAAAAADBQQAAgYBAQEBAAAAAAAAAAAAAAAAAAIBBBAAAQIDBwUBAAAAAAAAAAAAAREAkQMCYVEhMtESBKHBghRxUhEBAQEAAAAAAAAAAAAAAAAAAAER/8AAEQgACwAUAwEiAAIRAAMRAP/aAAwDAQACEQMRAD8A44Vzzia5h8z3KtoeTNwJFRQIpNRJAt3OIDu3E3p0sYZ2QfXj20GKuQFzVx1UsfsD9TIjRrIu43mJaV//2Q==',
  fallbackUrl: 'https://youtu.be/xxx',
  timeout: 50000,
  mobileBreakpoint: 768,
} as const;
