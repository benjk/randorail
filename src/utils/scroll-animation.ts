/**
 * Initialise les animations au scroll
 * @param {number} visibilityThreshold - % de l'élément visible pour trigger (0 à 1)
 */
export function initScrollAnimations(visibilityThreshold: number = 0.2): void {
  // Map pour stocker les éléments par groupe
  const animationGroups = new Map<string, Set<Element>>();

  // Collecte tous les éléments avec data-animate-group
  document.querySelectorAll('[data-animate-group]').forEach((el) => {
    const groupId = (el as HTMLElement).dataset.animateGroup;
    if (groupId) {
      if (!animationGroups.has(groupId)) {
        animationGroups.set(groupId, new Set());
      }
      animationGroups.get(groupId)!.add(el);
    }
  });

  // Observer pour les éléments groupés (observe les conteneurs)
  const groupObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const groupId = (entry.target as HTMLElement).dataset.animateGroup;

          if (groupId && animationGroups.has(groupId)) {
            const children = Array.from(animationGroups.get(groupId)!);
            const staggerDelay = parseInt(
              (entry.target as HTMLElement).dataset.animateStagger || '0',
            );

            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('is-visible');

                const counter = child as HTMLElement;
                if (counter.dataset.counter) {
                  animateCounter(counter);
                }
              }, index * staggerDelay);
            });

            groupObserver.unobserve(entry.target);
          }
        }
      });
    },
    { threshold: visibilityThreshold },
  );

  // Observer pour les éléments indépendants
  const individualObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');

          // Animation des compteurs
          const counter = entry.target as HTMLElement;
          if (counter.dataset.counter) {
            animateCounter(counter);
            individualObserver.unobserve(counter);
          }
        }
      });
    },
    { threshold: visibilityThreshold },
  );

  // Observe les conteneurs de groupe (ceux qui ont data-animate-group mais pas data-animate)
  document.querySelectorAll('[data-animate-group]').forEach((el) => {
    const element = el as HTMLElement;
    const hasDataAnimate = element.hasAttribute('data-animate');
    const groupId = element.dataset.animateGroup;

    // Si c'est un conteneur (pas d'animation propre), on l'observe
    if (!hasDataAnimate && groupId && animationGroups.has(groupId)) {
      groupObserver.observe(element);
    }
  });

  // Observe les éléments avec animation individuelle (sans groupe)
  document
    .querySelectorAll('[data-animate]:not([data-animate-group])')
    .forEach((el) => {
      individualObserver.observe(el);
    });

  // Observe les compteurs individuels
  document
    .querySelectorAll('[data-counter]:not([data-animate-group])')
    .forEach((el) => {
      individualObserver.observe(el);
    });

  /**
   * Anime un compteur de 0 à sa valeur cible
   * @param {HTMLElement} element - L'élément à animer
   */
  function animateCounter(element: HTMLElement): void {
    const target = parseFloat(element.dataset.counter || '0');
    const duration = parseInt(element.dataset.duration || '1500');
    const decimals = parseInt(element.dataset.decimals || '0');
    const suffix = element.dataset.suffix || '';

    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      element.textContent = current.toFixed(decimals) + suffix;
    }, 16);
  }
}
