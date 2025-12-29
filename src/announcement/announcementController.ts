// ========================================
// ANNOUNCEMENT CONTROLLER
// ========================================

const STORAGE_KEY = 'announcementSeen';
const EXPIRATION_DELAY = 24 * 60 * 60 * 1000; // 24h en millisecondes

// ========================================
// Variables globales du module
// ========================================

let modal: HTMLElement | null = null;
let banner: HTMLElement | null = null;
let container: HTMLElement | null = null;

// Event handlers pour le cleanup
let handleTabKey: ((e: KeyboardEvent) => void) | null = null;
let handleEscKey: ((e: KeyboardEvent) => void) | null = null;

// ========================================
// Gestion localStorage avec expiration
// ========================================

function hasSeenRecentlyAnnouncement(): boolean {
  const seenTimestamp = localStorage.getItem(STORAGE_KEY);
  
  if (!seenTimestamp) return false;
  
  const now = Date.now();
  const seenDate = parseInt(seenTimestamp, 10);
  
  // Si le timestamp est invalide ou trop vieux (> 24h)
  if (isNaN(seenDate) || (now - seenDate) > EXPIRATION_DELAY) {
    return false;
  }
  
  return true;
}

// ========================================
// Gestion de la modale
// ========================================

async function openModal(): Promise<void> {
  if (!modal) return;
  
  const img = modal.querySelector('.announcement-img') as HTMLImageElement;

  // Attend le chargement de l'image si présente
  if (img && !img.complete) {
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Continue même si erreur
    });
  }

  modal.classList.add('is-visible');
  setupModalAccessibility();
}

function showBanner(): void {
  if (banner) {
    banner.classList.add('is-visible');
    container?.classList.add('has-mobile-banner');
  }
}

function closeModal(): void {
  if (!modal) return;

  modal.classList.remove('is-visible');

  if (banner) {
    banner.classList.add('is-visible');
    container?.classList.add('has-mobile-banner');
  }

  // Stocke le timestamp actuel
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
  
  // Cleanup des event listeners
  cleanupModalListeners();
}

// ========================================
// Accessibilité modale
// ========================================

function setupModalAccessibility(): void {
  if (!modal) return;
  
  // Nettoie les anciens listeners si existent
  cleanupModalListeners();
  
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
  handleTabKey = (e: KeyboardEvent) => {
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
  handleEscKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  document.addEventListener('keydown', handleTabKey);
  document.addEventListener('keydown', handleEscKey);
}

function cleanupModalListeners(): void {
  if (handleTabKey) {
    document.removeEventListener('keydown', handleTabKey);
    handleTabKey = null;
  }
  if (handleEscKey) {
    document.removeEventListener('keydown', handleEscKey);
    handleEscKey = null;
  }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners(): void {
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
  // Cache les éléments DOM
  modal = document.querySelector('.announcement-modal');
  banner = document.querySelector('.announcement-banner');
  container = document.querySelector('#main-container');
  
  // Early return si pas de modale
  if (!modal) return;
  
  const hasSeenRecently = hasSeenRecentlyAnnouncement();

  setupEventListeners();

  if (hasSeenRecently) {
    // Déjà vue récemment → affiche juste le banner
    showBanner();
  } else {
    // Pas vue ou expirée → ouvre la modale
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