/**
 * Initialise les animations au scroll, section par section
 * @param {number} visibilityThreshold - % de l'élément visible pour trigger (0 à 1)
 */
export function initScrollAnimations(visibilityThreshold: number = 0.2): void {
  document
    .querySelectorAll<HTMLElement>('[data-animate-group]')
    .forEach((group) => {
      const children = Array.from(
        group.querySelectorAll<HTMLElement>('[data-animate]'),
      );
      const staggerDelay = parseInt(group.dataset.animateStagger || '5');
      const threshold = parseFloat(
        group.dataset.threshold || String(visibilityThreshold),
      );

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              children.forEach((child, index) => {
                setTimeout(() => {
                  requestAnimationFrame(() =>
                    child.classList.add('is-visible'),
                  );

                  // Compteur
                  if (child.dataset.counter) animateCounter(child);
                }, index * staggerDelay);
              });

              observer.unobserve(entry.target);
            }
          });
        },
        { threshold },
      );

      observer.observe(group);
    });

  // ----------- Animation pour éléments individuels ----------
  const individualObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add('is-visible');

          if (el.dataset.counter) animateCounter(el);
          individualObserver.unobserve(el);
        }
      });
    },
    { threshold: visibilityThreshold },
  );

  document
    .querySelectorAll<HTMLElement>(
      '[data-animate]:not([data-animate-group]), [data-counter]:not([data-animate-group])',
    )
    .forEach((el) => individualObserver.observe(el));

  // ----------- Fonction compteur ----------
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
