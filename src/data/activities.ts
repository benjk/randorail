import content from './content.json';

// --- Méta infos “bonus” pour chaque activité ---
const activityMeta: Record<
  string,
  { bgImage: string; icon: string; description?: string }
> = {
  'activities/randorail': {
    bgImage: '/img/activities/rando-card.webp',
    icon: '/img/icons/picto-rail.svg',
    description: 'Découvrez le Randorail du pays de Lumbres',
  },
  'activities/trottitrail': {
    bgImage: '/img/activities/trotti-card.webp',
    icon: '/img/icons/picto-trotti.svg',
    description: 'Balades en trottinette tout terrain',
  },
  'activities/bivouac': {
    bgImage: '/img/activities/bivouac-card.webp',
    icon: '/img/icons/picto-bivouac.svg',
    description: 'Nuit en pleine nature',
  },
  'activities/chasse-au-tresor': {
    bgImage: '/img/activities/chasse-card.webp',
    icon: '/img/icons/picto-carte.svg',
    description: 'Jeu d’aventure pour petits et grands',
  },
  groupes: {
    bgImage: '/img/activities/seminaires-card.webp',
    icon: '/img/icons/picto-groupe.svg',
    description: 'Séminaires, team-buulding, et événements d’entreprise',
  },
  'activities/filets': {
    bgImage: '/img/activities/bivouac-card.webp',
    icon: '/img/icons/picto-filet.svg',
    description: 'Le parc du filet qui va bientôt ouvrir ses portes',
  },
};

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
  .filter((page) => activityMeta[page.slug])
  .map((page) => ({
    ...page,
    ...activityMeta[page.slug],
  }));
