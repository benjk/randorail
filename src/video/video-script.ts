// video-script.ts
import { VIDEO_CONFIG } from '../config';

export function initVideoFunction(): void {
  console.log('🎬 initVideoFunction() appelée');

  const video = document.querySelector('.video-bg') as HTMLVideoElement;
  const posterHD = document.querySelector('.video-poster') as HTMLImageElement;
  const posterBlur = document.querySelector('.video-blur') as HTMLElement;
  const btn = document.querySelector('.video-control-btn') as HTMLElement;

  console.log('🔍 Éléments trouvés:', { video, posterHD, posterBlur, btn });

  if (!video || !posterHD) {
    console.error('❌ MANQUANT:', { video: !!video, posterHD: !!posterHD });
    return;
  }

  const fallbackUrl = VIDEO_CONFIG.fallbackUrl || '';
  console.log('🔗 Fallback URL:', fallbackUrl);

  let fallbackTriggered = false;
  let stallCount = 0;
  let stallTimer: number | null = null;
  let startTimeout: number | null = null; // ⚡ DÉCLARÉ ICI EN HAUT

  const MAX_STALLS = 3;
  const LONG_STALL_MS = 1000;

  // AbortController pour cleanup propre
  const ac = new AbortController();
  const signal = ac.signal;

  // 🖱️ Toggle play/pause
  if (btn) {
    btn.addEventListener('click', () => {
      console.log('🖱️ Click bouton, fallbackTriggered:', fallbackTriggered);

      if (fallbackUrl && fallbackTriggered) {
        console.log('🔗 Ouverture fallback URL');
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } else if (!fallbackTriggered) {
        console.log('⏯️ Toggle play/pause');
        video.paused ? video.play() : video.pause();
      }
    });
  }

  // 🔥 Détection de connexion
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  console.log('📡 Connection info:', {
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    saveData: connection?.saveData,
  });

  // Save Data activé → poster direct
  if (connection?.saveData) {
    console.log('💾 Save Data activé → poster');
    handleFallback();
    return;
  }

  // Connexion 2G/3G → poster direct
  if (
    connection?.effectiveType &&
    ['slow-2g', '2g', '3g'].includes(connection.effectiveType)
  ) {
    console.log(`📶 Connexion ${connection.effectiveType} → poster`);
    handleFallback();
    return;
  }

  // Downlink < 1.5 Mbps → poster direct
  if (connection?.downlink && connection.downlink < 1.5) {
    console.log(`📉 Downlink faible (${connection.downlink} Mbps) → poster`);
    handleFallback();
    return;
  }

  // 📡 Surveille les changements de connexion
  if (connection?.addEventListener) {
    connection.addEventListener(
      'change',
      () => {
        console.log('📡 Connexion changée:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          saveData: connection.saveData,
        });

        if (!fallbackTriggered && connection.saveData) {
          console.log('💾 Save Data activé en cours de lecture → poster');
          handleFallback();
        }
      },
      { signal },
    );
  }

  console.log('✅ Connexion OK, tentative vidéo...');

  // 🎬 Lancement de la vidéo
  if (video.readyState >= 3) {
    console.log('⚡ Vidéo déjà prête → lecture immédiate');
    playVideo();
  } else {
    console.log('⏳ Attente canplay...');

    // Timeout de démarrage (3s max pour être prêt)
    startTimeout = window.setTimeout(() => {
      if (!fallbackTriggered && video.readyState < 3) {
        console.warn('⏱️ Timeout démarrage (3s) → poster');
        handleFallback();
      }
    }, 3000);

    video.addEventListener(
      'canplay',
      () => {
        console.log('🎥 Event canplay');
        if (fallbackTriggered) return;
        if (startTimeout) clearTimeout(startTimeout);
        playVideo();
      },
      { once: true, signal },
    );

    video.addEventListener(
      'error',
      (e) => {
        console.error('❌ Video error:', e);
        if (startTimeout) clearTimeout(startTimeout);
        handleFallback();
      },
      { once: true, signal },
    );
  }

  // 🛑 Détection buffering - hybride durée + occurrences
  video.addEventListener(
    'waiting',
    () => {
      stallCount++;
      console.warn(`⏳ Stall #${stallCount}`);

      // Démarre timer pour stall long
      if (!stallTimer) {
        stallTimer = window.setTimeout(() => {
          console.warn('❌ Stall trop long (1s+) → poster');
          handleFallback();
        }, LONG_STALL_MS);
      }

      // Ou trop de micro-stalls
      if (stallCount >= MAX_STALLS) {
        console.warn('❌ Trop de stalls → poster');
        handleFallback();
      }
    },
    { signal },
  );

  video.addEventListener(
    'playing',
    () => {
      console.log('▶️ Playing');

      // Reset timer stall si ça repart
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }

      if (btn) {
        btn.classList.remove('paused');
        btn.classList.add('playing');
      }
    },
    { signal },
  );

  video.addEventListener(
    'pause',
    () => {
      console.log('⏸️ Paused');
      if (btn) {
        btn.classList.remove('playing');
        btn.classList.add('paused');
      }
    },
    { signal },
  );

  function playVideo() {
    console.log('▶️ playVideo() appelée');
    video
      .play()
      .then(() => {
        console.log('✅ Video playing!');
        posterBlur?.remove();
        posterHD.classList.add('inactive');
        if (btn) {
          btn.style.opacity = '1';
          btn.classList.add('ready', 'playing');
        }
      })
      .catch((err) => {
        console.error('❌ Play error:', err);
        handleFallback();
      });
  }

  function handleFallback() {
    console.log('📸 Poster fallback');
    if (fallbackTriggered) return;
    fallbackTriggered = true;

    // Cleanup tous les listeners
    ac.abort();

    // Cleanup timers
    if (startTimeout) clearTimeout(startTimeout);
    if (stallTimer) clearTimeout(stallTimer);

    video.pause();
    video.remove();
    posterHD.classList.add('loaded');
    posterHD.classList.remove('inactive');

    posterBlur?.remove();

    if (btn) {
      btn.classList.add('error');
      btn.classList.remove('playing', 'paused');
    }
  }
}
