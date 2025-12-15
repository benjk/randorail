import { ActivityMeta } from './activities-type';
import content from './content.json';

const activityMeta: Record<string, ActivityMeta> = {
  randorail: {
    bgImage: '/img/activities/rando-card.webp',
    icon: 'picto-rail',
    description: 'Découvrez le Randorail du pays de Lumbres',
    url: 'https://resa.euresto.com/6d6136a2-375f-40b5-8b38-7d9f1f85934f/3135200c-b322-11f0-8145-00505639ca82',
  },
  trottitrail: {
    bgImage: '/img/activities/trotti-card.webp',
    icon: 'picto-trotti',
    description: 'Balades en trottinette tout terrain',
    url: 'https://resa.euresto.com/6d6136a2-375f-40b5-8b38-7d9f1f85934f/3135200c-b322-11f0-8145-00505639ca82',
  },
  bivouac: {
    bgImage: '/img/activities/bivouac-card.webp',
    icon: 'picto-bivouac',
    description: 'Nuit en pleine nature',
    url: 'https://resa.euresto.com/6d6136a2-375f-40b5-8b38-7d9f1f85934f/3135200c-b322-11f0-8145-00505639ca82',
  },
  chasse: {
    bgImage: '/img/activities/chasse-card.webp',
    icon: 'picto-carte',
    description: "Jeu d'aventure pour petits et grands",
    url: 'https://resa.euresto.com/6d6136a2-375f-40b5-8b38-7d9f1f85934f/3135200c-b322-11f0-8145-00505639ca82',
  },
  groupes: {
    bgImage: '/img/activities/groupes-card.webp',
    icon: 'picto-groupe',
    description: "Séminaires, team-building, et événements d'entreprise",
  },
  filets: {
    bgImage: '/img/activities/bivouac-card.webp',
    icon: 'picto-filet',
    description: 'Le parc du filet qui va bientôt ouvrir ses portes',
  },
};

function getSimpleKey(slug: string): string {
  if (slug === 'groupes') return slug;
  return slug.replace('activities/', '');
}

// Helper pour convertir clé simplifiée → slug complet
function getFullSlug(key: string): string {
  if (key === 'groupes') return key;
  return `activities/${key}`;
}

// --- Extraire les activités depuis le menu ---
function flattenMenu(menu: any[]): { title: string; slug: string }[] {
  return menu.flatMap((item) => {
    // Si c'est une page simple, on la retourne
    if (item.type === 'page') return [item];

    // Si c'est un submenu avec un slug (comme "Groupes"), on le retourne + ses enfants
    if (item.type === 'submenu') {
      const items = [];
      if (item.slug) {
        items.push({ title: item.title, slug: item.slug });
      }
      if (item.children) {
        items.push(...flattenMenu(item.children));
      }
      return items;
    }

    return [];
  });
}

const allPages = flattenMenu(content.menu);

// --- Fusionner menu + méta → ne garder que celles qui ont une meta ---
export const activitiesWithMeta = allPages
  .filter((page) => activityMeta[getSimpleKey(page.slug)])
  .map((page) => ({
    ...page,
    ...activityMeta[getSimpleKey(page.slug)],
  }));

/**
 * Récupère le contenu complet d'une activité (JSON + meta)
 * @param slug - Le slug complet depuis le routing Astro (ex: "activities/randorail")
 */
export function getActivityContent(simpleKey: string) {
  const slug = getFullSlug(simpleKey);
  const pageData = (content.pages as any)[simpleKey];
  const meta = activityMeta[simpleKey];

  if (!pageData) {
    throw new Error(
      `❌ Page content missing for activity: ${slug}\n` +
        `Looking for key: "${simpleKey}"\n` +
        `Available keys: ${Object.keys(content.pages).join(', ')}`,
    );
  }

  if (!meta) {
    throw new Error(
      `❌ Meta missing for activity: ${slug}\n` +
        `Expected key: "${simpleKey}" in activityMeta\n` +
        `Available keys: ${Object.keys(activityMeta).join(', ')}`,
    );
  }

  return {
    ...pageData,
    ...meta,
    slug, // On garde le slug complet pour le routing
  };
}

/**
 * Récupère la FAQ d'une activité par son slug
 * @param slug - Le slug complet depuis le routing Astro (ex: "activities/randorail")
 */
export function getActivityFAQ(slug: string) {
  const simpleKey = getSimpleKey(slug);

  return (content.faq || []).filter((item: any) =>
    item.tags.includes(simpleKey) || item.tags.includes('all'),
  );
}
