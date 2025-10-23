import { createImageRules } from '../components/images/imageRulesFactory';

export const imageRules = createImageRules({
  META_SEO_FAVICON: {
    name: 'favicon.png',
    label: 'Icône principale du site (favicon)',
    idealRatio: 1,
    ratioTolerance: 0.1, // on préfère un carré
    minWidth: 256,
    minHeight: 256,
    maxWeight: 3,
    supportedTypes: ['image/png', 'image/jpeg'],
    folder: '/img/icons/',
    extraInfo: 'Icône de votre site.',
    autoGenerateIcons: true,
  },

  META_OG_IMAGE: {
    name: 'og-img.jpg',
    label: 'Image de partage (réseaux sociaux)',
    idealRatio: 1.91,
    ratioTolerance: 0.2,
    maxWidth: 2400,
    maxHeight: 1260,
    minWidth: 600,
    minHeight: 315,
    imgFormat: 'landscape',
    supportedTypes: ['image/jpeg', 'image/png'],
    shouldConvertWebp: false,
    idealWidth: 1200,
    idealHeight: 630,
    folder: '/img/og/',
    extraInfo:
      'Image affichée lors du partage du site sur les réseaux sociaux ou par mail.',
  },

  META_OG_TWITTER_IMAGE: {
    name: 'og-img-square.jpg',
    label: 'Image de partage (Twitter)',
    maxWeight: 2,
    idealRatio: 1,
    ratioTolerance: 0.05,
    maxWidth: 2000,
    maxHeight: 2000,
    imgFormat: 'both',
    supportedTypes: ['image/jpeg', 'image/png'],
    shouldConvertWebp: false,
    idealWidth: 800,
    idealHeight: 800,
    folder: '/img/og/',
    extraInfo:
      'Image affichée lors du partage du site sur les réseaux sociaux. Format spécifique carré pour Twitter, Discord,... ',
  },
});
