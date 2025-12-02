export function initVideoFunction(): void {
  const btn = document.querySelector('.video-control-btn') as HTMLElement;
  let isPlaying = true;
  let videoReady = false;
  let fallbackUrl = '';

  // Vidéo prête
  window.addEventListener('video-hero:ready', () => {
    videoReady = true;
    btn.style.opacity = '1'; // Ou autre feedback visuel
  });

  // Vidéo en lecture
  window.addEventListener('video-hero:playing', () => {
    isPlaying = true;
    btn.classList.remove('paused');
    btn.classList.add('playing');
  });

  // Vidéo en pause
  window.addEventListener('video-hero:paused', () => {
    isPlaying = false;
    btn.classList.remove('playing');
    btn.classList.add('paused');
  });

  // Vidéo a échoué
  window.addEventListener('video-hero:error', (e: any) => {
    fallbackUrl = e.detail.fallbackUrl;
    btn.classList.add('error');
    // Transformer le bouton en lien ou changer l'icône
  });

  // Click sur le bouton
  btn.addEventListener('click', () => {
    if (!videoReady || fallbackUrl) {
      // Rediriger vers fallback
      window.open(fallbackUrl, '_blank');
    } else {
      // Toggle play/pause
      window.dispatchEvent(new CustomEvent('video-hero:toggle'));
    }
  });
}
