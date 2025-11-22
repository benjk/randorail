// src/scripts/scroll-animations.js

/**
 * Initialise les animations au scroll
 * @param {number} visibilityThreshold - % de l'élément visible pour trigger (0 à 1)
 * @param {number} staggerDelay - Délai entre chaque élément en ms
 */
export function initScrollAnimations(visibilityThreshold: number = 0.2, staggerDelay: number = 150): void {

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: visibilityThreshold },
  );

  // Anime les éléments simples
  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });

  // Anime les éléments en stagger
  document
    .querySelectorAll<HTMLElement>('[data-stagger]')
    .forEach((container) => {
      const items = Array.from(container.children) as HTMLElement[];

      items.forEach((item, index) => {
        item.style.transitionDelay = `${index * staggerDelay}ms`;
        observer.observe(item);
      });
    });
}
