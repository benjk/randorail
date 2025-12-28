// ========================================
// ANNOUNCEMENT CONTROLLER
// ========================================

const STORAGE_KEY = 'announcementSeen';

let scrollY = 0;

// ========================================
// Utilitaires Scroll Lock
// ========================================

function lockScroll(): void {
  scrollY = window.scrollY;
  document.body.style.top = `-${scrollY}px`;
  document.body.classList.add('modal-open');
}

function unlockScroll(): void {
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
}

// ========================================
// Gestion de la modale
// ========================================

async function openModal(): Promise<void> {
  const modal = document.querySelector('.announcement-modal') as HTMLElement;
  const img = modal?.querySelector('.announcement-img') as HTMLImageElement;

  if (!modal) return;

  // Attend le chargement de l'image si présente
  if (img && !img.complete) {
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Continue même si erreur
    });
  }

  // Affiche la modale
  modal.classList.add('is-visible');
  lockScroll();

  // Focus trap et accessibilité
  setupModalAccessibility(modal);
}

function showBanner(): void {
  const banner = document.querySelector('.announcement-banner') as HTMLElement;
  if (banner) {
    banner.classList.add('is-visible');
    document
      .querySelector('#main-container')
      ?.classList.add('has-mobile-banner');
  }
}

function closeModal(): void {
  const modal = document.querySelector('.announcement-modal') as HTMLElement;
  const banner = document.querySelector('.announcement-banner') as HTMLElement;

  if (!modal) return;

  modal.classList.remove('is-visible');
  unlockScroll();

  if (banner) {
    banner.classList.add('is-visible');

    // Ajoute classe sur body
    if (window.innerWidth <= 768) {
      document.body.classList.add('has-mobile-banner');
    }
  }

  sessionStorage.setItem(STORAGE_KEY, 'true');
}

// ========================================
// Accessibilité modale
// ========================================

function setupModalAccessibility(modal: HTMLElement): void {
  // Elements focusables dans la modale
  const focusableElements = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  if (focusableElements.length === 0) return;

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Focus sur le premier élément
  firstFocusable.focus();

  // Focus trap
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  // ESC pour fermer
  const handleEscKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener('keydown', handleTabKey);
    document.removeEventListener('keydown', handleEscKey);
  };

  document.addEventListener('keydown', handleTabKey);
  document.addEventListener('keydown', handleEscKey);
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners(): void {
  const modal = document.querySelector('.announcement-modal');
  const banner = document.querySelector('.announcement-banner');
  const closeBtn = modal?.querySelector('.modal-close');
  const overlay = modal?.querySelector('.modal-overlay');

  // Bouton fermeture
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Clic sur overlay
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  // Clic sur banner → réouvre modale
  if (banner) {
    banner.addEventListener('click', () => {
      openModal();
    });

    // Accessibilité : Enter/Space sur banner
    banner.addEventListener('keydown', (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
        keyEvent.preventDefault();
        openModal();
      }
    });
  }
}

// ========================================
// Initialisation
// ========================================

export function initAnnouncement(): void {
  const hasSeenAnnouncement = sessionStorage.getItem(STORAGE_KEY) === 'true';

  setupEventListeners();

  if (hasSeenAnnouncement) {
    // Déjà vue → affiche juste le banner
    showBanner();
  } else {
    // Pas encore vue → ouvre la modale
    openModal();
  }
}

// ========================================
// Auto-init au DOMContentLoaded
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnnouncement);
} else {
  initAnnouncement();
}
