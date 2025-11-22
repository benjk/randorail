/**
 * Initialise les animations au scroll
 * @param {number} visibilityThreshold - % de l'élément visible pour trigger (0 à 1)
 */
export function initScrollAnimations(visibilityThreshold: number = 0.2): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');

          // Animation des compteurs
          const counter = entry.target as HTMLElement;
          if (counter.dataset.counter) {
            animateCounter(counter);
            observer.unobserve(counter); // Arrête d'observer cet élément
          }
        }
      });
    },
    { threshold: visibilityThreshold },
  );

  // Anime les éléments simples
  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });
  // Observe les compteurs
  document.querySelectorAll('[data-counter]').forEach((el) => {
    observer.observe(el);
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
