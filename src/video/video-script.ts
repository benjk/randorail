import { VIDEO_CONFIG } from '../config';

const THRESHOLDS = {
  // Bande passante (Mbps)
  bandwidth: {
    minForVideo: 0.18, // En dessous → poster
    sd: 0.18,
    hd: 1.45,
    uhd: 5.0,
  },

  // Device (limites hardware)
  device: {
    minCoresForHD: 4, // < 4 threads → max SD
    minMemoryForHD: 4, // < 4 GB RAM → max SD (si dispo)
    minWidthForUHD: 1080, // < 1920px largeur → pas de UHD
  },

  // Speed test
  speedTest: {
    timeout: 15000, // Apres 15s de speed-test : POSTER
    fileSizeKb: 433,
  },

  videoTimeoutMax: 130000,
} as const;

export async function initVideoFunction(): Promise<void> {
  console.log('🎬 Init video system');

  const video = document.querySelector('.video-bg') as HTMLVideoElement;
  const btn = document.querySelector('.video-icon-link') as HTMLElement;

  if (!video) {
    console.error('❌ Vidéo manquante');
    return;
  }

  let fallbackTriggered = false;

  // 1. PRÉ-TRI
  const preCheckResult = shouldAttemptVideo();
  if (!preCheckResult) {
    console.log('📸 Pré-tri → Poster');
    fallbackTriggered = true;
    return;
  }

  // 2. DETECTION DEVICE (instantané)
  const device = detectDeviceCapabilities();
  console.log('📱 Device:', device);

  // 3. PRELOAD OPTIMISTE SD + SPEED TEST EN PARALLÈLE
  console.log('⚡ Preload SD optimiste + speed test...');

  const sdSource = device.preferMp4 ? VIDEO_CONFIG.sdMp4 : VIDEO_CONFIG.sdWebm;

  video.preload = 'auto';
  video.src = sdSource;
  console.log('📥 Preload SD démarré:', sdSource);

  // Lance speed test en parallèle
  const bandwidth = await performSpeedTest();

  // 4. ANALYSE RÉSULTAT
  if (!bandwidth || bandwidth < THRESHOLDS.bandwidth.minForVideo) {
    console.log(`📸 Speed test insuffisant → Poster`);
    fallbackTriggered = true;

    // Abort preload SD
    video.preload = 'none';
    video.src = '';
    return;
  }

  // 5. CHOIX QUALITÉ FINALE
  const quality = selectVideoQuality(bandwidth, device);
  console.log(`🎥 Qualité finale: ${quality} (${bandwidth.toFixed(2)} Mbps)`);

  // 6. SWITCH VERS HD/UHD SI NÉCESSAIRE
  if (quality !== 'SD') {
    console.log(`🔄 Switch SD → ${quality}`);

    // Abort SD
    video.preload = 'none';
    video.src = '';

    // Charge la bonne qualité
    const newSource = getVideoSource(quality, device);
    video.src = newSource;
    video.preload = 'auto';
  } else {
    console.log('✅ SD OK, on garde');
  }

  // 7. PLAY VIDEO
  try {
    await playVideo(video, btn);
  } catch (error) {
    console.error('❌ Erreur lecture vidéo:', error);
    fallbackTriggered = true;
  }
}

/* Test Si 2g ou mode saveData ON -> Fallback POSTER instant */
function shouldAttemptVideo(): boolean {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  // Pas de Connection API → passer au speed test
  if (!connection) {
    console.log('⚠️ Connection API indisponible → Speed test requis');
    return true;
  }

  // Save Data activé → POSTER
  if (connection.saveData === true) {
    console.log('💾 Save Data activé → connexion considérée faible');
    return false;
  }

  // effectiveType vaut 2G/slow-2g → POSTER
  if (
    connection.effectiveType &&
    ['slow-2g', '2g'].includes(connection.effectiveType)
  ) {
    console.log(
      `📶 ${connection.effectiveType} détecté → connexion considérée faible`,
    );
    return false;
  }

  // Tous les autres cas (3g, 4g, etc.) → connexion semble OK --> SPEED TEST
  console.log(
    `📶 ${connection.effectiveType || 'unknown'} → connexion présumée OK`,
  );
  return true;
}

/**
 * Détecte les capacités de l'appareil (CPU, RAM, écran, OS)
 */
function detectDeviceCapabilities(): DeviceCapabilities {
  const ua = navigator.userAgent.toLowerCase();

  // Safari (desktop + mobile) = MP4 obligatoire (support WebM pourri)
  const isSafari =
    ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');

  const preferMp4 = isSafari;

  return {
    hardwareConcurrency: navigator.hardwareConcurrency || 2,
    deviceMemory: (navigator as any).deviceMemory,
    screenWidth: window.innerWidth,
    preferMp4,
  };
}

/**
 * Mesure la bande passante réelle via un fichier test
 * @returns Bande passante en Mbps, ou null si échec/timeout
 */
async function performSpeedTest(): Promise<number | null> {
  const { timeout, fileSizeKb } = THRESHOLDS.speedTest;
  const testFileUrl = VIDEO_CONFIG.speedTestVideo;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = performance.now();

    const response = await fetch(testFileUrl, {
      signal: controller.signal,
      cache: 'no-store', // sinon le speedTest mesure le cache -> triche !
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    // Attend la fin du téléchargement
    await response.blob();

    const endTime = performance.now();
    clearTimeout(timeoutId);

    const durationSeconds = (endTime - startTime) / 1000;
    const bandwidthMbps = (fileSizeKb * 8) / (durationSeconds * 1000);

    console.log(
      `⚡ Speed test: ${bandwidthMbps.toFixed(2)} Mbps en ${durationSeconds.toFixed(2)}s`,
    );

    return bandwidthMbps;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn('⏱️ Speed test timeout (>3s)');
    } else {
      console.error('❌ Speed test error:', error);
    }

    return null;
  }
}

/**
 * Sélectionne la qualité vidéo optimale selon bande passante + device
 */ function selectVideoQuality(
  bandwidth: number,
  device: DeviceCapabilities,
): VideoQuality {
  const { hardwareConcurrency, deviceMemory, screenWidth } = device;

  // Device trop faible → SD forcé
  const isLowEndDevice =
    hardwareConcurrency < THRESHOLDS.device.minCoresForHD ||
    (deviceMemory !== undefined &&
      deviceMemory < THRESHOLDS.device.minMemoryForHD);

  if (isLowEndDevice) {
    console.log('📱 Device faible → SD forcé');
    return 'SD';
  }

  console.log('📱 Device : ');
  console.log(bandwidth);
  console.log(screenWidth);
  console.log(THRESHOLDS.device.minWidthForUHD);
  // Bande passante suffisante pour UHD ET écran large ?
  if (
    bandwidth >= THRESHOLDS.bandwidth.uhd &&
    screenWidth >= THRESHOLDS.device.minWidthForUHD
  ) {
    console.log('🎥 UHD sélectionné');
    return 'UHD';
  }

  // Bande passante suffisante pour HD ?
  if (bandwidth >= THRESHOLDS.bandwidth.hd) {
    console.log('🎥 HD sélectionné');
    return 'HD';
  }

  // Par défaut → SD
  console.log('🎥 SD sélectionné');
  return 'SD';
}

// Retourne l'url
function getVideoSource(quality: string, device: DeviceCapabilities): string {
  const { preferMp4 } = device;

  switch (quality) {
    case 'SD':
      return preferMp4 ? VIDEO_CONFIG.sdMp4 : VIDEO_CONFIG.sdWebm;
    case 'HD':
      return preferMp4 ? VIDEO_CONFIG.hdMp4 : VIDEO_CONFIG.hdWebm;
    case 'UHD':
      return preferMp4 ? VIDEO_CONFIG.hdMp4 : VIDEO_CONFIG.uhdWebm;
    default:
      return VIDEO_CONFIG.sdMp4;
  }
}

async function playVideo(
  video: HTMLVideoElement,
  btn: HTMLElement | null,
): Promise<void> {
  console.log('🎬 playVideo() APPELÉ');

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Video load timeout'));
    }, THRESHOLDS.videoTimeoutMax);

    const startPlayback = () => {
      clearTimeout(timeout);
      console.log('🎥 Vidéo prête');
      video.setAttribute('autoplay', '');
      video.classList.add('playing');

      video
        .play()
        .then(() => {
          console.log('▶️ Lecture démarrée');

          if (btn) {
            setupPlayPauseButton(btn, video);
          }

          resolve();
        })
        .catch(reject);
    };

    // Si la vidéo est DÉJÀ prête
    if (video.readyState >= 3) {
      console.log('⚡ Vidéo déjà prête (readyState:', video.readyState, ')');
      startPlayback();
      return;
    }

    console.log(
      '⏳ Attente canplay (readyState actuel:',
      video.readyState,
      ')',
    );

    const handleReady = () => {
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplaythrough', handleReady);
      startPlayback();
    };

    video.addEventListener('canplay', handleReady, { once: true });
    video.addEventListener('loadeddata', handleReady, { once: true });
    video.addEventListener('canplaythrough', handleReady, { once: true });

    video.addEventListener(
      'error',
      (e) => {
        clearTimeout(timeout);
        console.error('❌ Video error event:', e);
        reject(new Error('Video error'));
      },
      { once: true },
    );
  });
}

/**
 * Remplace le comportement du lien fallback par play/pause
 */
function setupPlayPauseButton(
  link: HTMLElement,
  video: HTMLVideoElement,
): void {
  if (!link) {
    console.warn('⚠️ Pas de btn trouvé');
    return;
  }

  // Vire le href pour désactiver l'ouverture d'onglet
  link.removeAttribute('href');
  link.style.cursor = 'pointer';

  // Ajoute le toggle play/pause
  link.addEventListener('click', (e) => {
    e.preventDefault();

    if (video.paused) {
      video.play();
      link.classList.remove('paused');
      link.classList.add('playing');
      console.log('▶️ Play');
    } else {
      video.pause();
      link.classList.remove('playing');
      link.classList.add('paused');
      console.log('⏸️ Pause');
    }
  });

  console.log('🎮 Play/Pause activé sur le bouton');
}
