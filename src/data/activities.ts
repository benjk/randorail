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
  'activities/trotti': {
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
  'seminaires': {
    bgImage: '/img/activities/seminaires-card.webp',
    icon: '/img/icons/picto-seminaire.svg',
    description: 'Séminaires, team-buulding, et événements d’entreprise',
  },
};

// --- Extraire les activités depuis le menu ---
function flattenMenu(menu: any[]): { title: string; slug: string }[] {
  return menu.flatMap((item) => {
    if (item.type === 'page') return [item];
    if (item.type === 'submenu' && item.children)
      return flattenMenu(item.children);
    return [];
  });
}

const allPages = flattenMenu(content.menu);
console.log("ALLLL : " + allPages);


// --- Fusionner menu + méta → ne garder que celles qui ont une meta ---
export const activitiesWithMeta = allPages
  .filter((page) => activityMeta[page.slug])
  .map((page) => ({
    ...page,
    ...activityMeta[page.slug],
  }));
