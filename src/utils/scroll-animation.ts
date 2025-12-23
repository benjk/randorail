/**
 * Initialise les animations au scroll, section par section
 * @param {number} visibilityThreshold - % de l'élément qui doit être au-dessus de la ligne de flottaison (0 à 1)
 */
export function initScrollAnimations(visibilityThreshold: number = 0.25): void {
  const animatedGroups = new Set<HTMLElement>();
  const animatedElements = new Set<HTMLElement>();

  // Groupes d'éléments
  const groups = Array.from(
    document.querySelectorAll<HTMLElement>('[data-animate-group]')
  );

  // Éléments individuels
  const individuals = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-animate]:not([data-animate-group] [data-animate]), [data-counter]:not([data-animate-group] [data-counter])'
    )
  );

  function checkElement(
    element: HTMLElement,
    threshold: number,
    processedSet: Set<HTMLElement>
  ): boolean {
    if (processedSet.has(element)) return false;

    const rect = element.getBoundingClientRect();
    const elementHeight = rect.height;
    const elementTop = rect.top + window.scrollY;
    const scrollPosition = window.scrollY + window.innerHeight; // Ligne de flottaison (bas du viewport)

    // Calcul : combien de % de l'élément est au-dessus de la ligne de flottaison
    const distanceScrolled = scrollPosition - elementTop;
    const percentScrolled = distanceScrolled / elementHeight;

    if (percentScrolled >= threshold) {
      processedSet.add(element);
      return true;
    }

    return false;
  }

  function handleScroll(): void {
    // Gérer les groupes
    groups.forEach((group) => {
      const threshold = parseFloat(
        group.dataset.threshold || String(visibilityThreshold)
      );

      if (checkElement(group, threshold, animatedGroups)) {
        const children = Array.from(
          group.querySelectorAll<HTMLElement>('[data-animate]')
        );
        const staggerDelay = parseInt(group.dataset.animateStagger || '5');

        children.forEach((child, index) => {
          setTimeout(() => {
            requestAnimationFrame(() => child.classList.add('is-visible'));
            if (child.dataset.counter) animateCounter(child);
          }, index * staggerDelay);
        });
      }
    });

    // Gérer les éléments individuels
    individuals.forEach((el) => {
      if (checkElement(el, visibilityThreshold, animatedElements)) {
        requestAnimationFrame(() => el.classList.add('is-visible'));
        if (el.dataset.counter) animateCounter(el);
      }
    });

    // Cleanup : retirer le listener si tout est animé
    if (
      animatedGroups.size === groups.length &&
      animatedElements.size === individuals.length
    ) {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    }
  }

  // Vérifier au chargement
  handleScroll();

  // Écouter le scroll et le resize
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleScroll, { passive: true });

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