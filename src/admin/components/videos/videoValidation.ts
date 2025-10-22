import { VideoRule } from './videoRulesFactory';

export const VIDEO_ERROR_MESSAGES = {
  notVideo: 'Fichier non vidéo refusé',
  tooLarge: (max: number) => `Vidéo trop lourde: max ${max} Mo`,
  invalidMimeType: 'Type de fichier non supporté ou corrompu',
  badPortrait: 'Format portrait attendu',
  badLandscape: 'Format paysage attendu',
  processingFailed: 'Erreur de traitement de la vidéo.',
};

export const validateVideoContent = async (file: File): Promise<boolean> => {
  // si le type MIME est reconnu comme vidéo, c’est suffisant
  if (!file.type.startsWith('video/')) return false;

  // test rapide : peut-on lire les metadata ?
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(true);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(false);
    };

    video.src = URL.createObjectURL(file);
  });
};

// Extrait largeur/hauteur pour vérifier l’orientation
export const extractVideoMetadata = (
  file: File,
): Promise<{ width: number; height: number; hasAudio: boolean }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        hasAudio:
          (video as any).mozHasAudio ||
          Boolean((video as any).webkitAudioDecodedByteCount) ||
          Boolean((video as any).audioTracks?.length),
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Impossible de lire les métadonnées vidéo'));
    };

    video.src = URL.createObjectURL(file);
  });
};

// Validation principale
export const processVideo = async (
  file: File,
  options: VideoRule,
): Promise<{
  file: File | null;
  previewUrl: string | null;
  error: string | null;
}> => {
  try {
    // 1. Type MIME
    if (!options.supportedTypes!.includes(file.type)) {
      return {
        file: null,
        previewUrl: null,
        error: VIDEO_ERROR_MESSAGES.notVideo,
      };
    }

    // 2. Signature
    const isValidVideo = await validateVideoContent(file);
    if (!isValidVideo) {
      return {
        file: null,
        previewUrl: null,
        error: VIDEO_ERROR_MESSAGES.invalidMimeType,
      };
    }

    // 3. Compression + conversion en WebM
    const webmBlob = await compressVideoToWebM(file, 1000); // 1 Mbps
    const compressedFile = new File(
      [webmBlob],
      `compressed_${file.name.split('.')[0]}.webm`,
      { type: 'video/webm' },
    );

    // 3. Vérification du poids
    if (compressedFile.size > options.maxWeight! * 1_048_576) {
      return {
        file: null,
        previewUrl: null,
        error: VIDEO_ERROR_MESSAGES.tooLarge(options.maxWeight!),
      };
    }

    // 4. Métadonnées
    const { width, height } = await extractVideoMetadata(compressedFile);
    if (options.videoFormat === 'portrait' && width >= height) {
      return {
        file: null,
        previewUrl: null,
        error: VIDEO_ERROR_MESSAGES.badPortrait,
      };
    }
    if (options.videoFormat === 'landscape' && height >= width) {
      return {
        file: null,
        previewUrl: null,
        error: VIDEO_ERROR_MESSAGES.badLandscape,
      };
    }

    // 5. Preview
    const previewUrl = URL.createObjectURL(compressedFile);
    return { file: compressedFile, previewUrl, error: null };
  } catch (err) {
    console.error('Erreur processVideo', err);
    return {
      file: null,
      previewUrl: null,
      error: VIDEO_ERROR_MESSAGES.processingFailed,
    };
  }
};

/**
 * Compresse une vidéo et la convertit en WebM avec MediaRecorder.
 * @param file - Fichier vidéo à compresser.
 * @param videoElement - Élément HTMLVideoElement utilisé pour la lecture.
 * @param maxBitrate - Bitrate max (en kbps, par défaut 1000 = 1 Mbps).
 * @returns Un Blob en format WebM.
 */
export const compressVideoToWebM = async (
  file: File,
  maxBitrate = 1000,
): Promise<Blob> => {
  console.log(
    '🔹 Taille originale :',
    (file.size / 1024 / 1024).toFixed(2),
    'Mo',
  );

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    video.style.position = 'fixed';
    video.style.left = '-10000px'; // cache la vidéo hors écran
    document.body.appendChild(video);

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const stream = (video as any).captureStream();
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: maxBitrate * 1000,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log(
          '🔹 Taille compressée :',
          (blob.size / 1024 / 1024).toFixed(2),
          'Mo',
        );
        resolve(blob);
      };

      recorder.start();
      video.onended = () => recorder.stop();
      video.play().catch(reject);
    };

    video.onerror = (err) => {
      cleanup();
      reject(new Error('Erreur lecture vidéo'));
    };
  });
};
