import imageCompression from 'browser-image-compression';
import { ImageFormat, ImageRuleOptions } from './imageRulesFactory';

export const ERROR_MESSAGES = {
  notImage: 'Fichier non image refusé',
  tooLarge: (max: number) => `Image trop lourde: max ${max} Mo`,
  tooBigDimensions: (maxW: number, maxH: number) =>
    `Image trop grande : max ${maxW}x${maxH}px`,
  tooSmall: (minW: number, minH: number) =>
    `Image trop petite : ${minW}x${minH}px minimum.`,
  badRatio: (width: number, height: number) =>
    `Ratio incorrect : ${width}x${height} attendus`,
  squareExpected: 'Une image carrée est attentdue',
  badPortrait: 'Format portrait attendu',
  badLandscape: 'Format paysage attendu',
  processingFailed:
    "Erreur de traitement de l'image. Format peut-être corrompu.",
  invalidMimeType: 'Type de fichier non supporté ou corrompu',
};

// Vérification rapide du contenu réel de l'image via les signatures
export const validateImageContent = async (file: File): Promise<boolean> => {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const header = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Signatures hex des formats courants d'images
  const signatures = {
    jpeg: ['ffd8ff'],
    png: ['89504e47'],
    gif: ['474946'],
    webp: ['52494646'], // RIFF header
    svg: ['3c737667'], // <svg
    bmp: ['424d'],
  };

  return Object.values(signatures).some((signatureList) =>
    signatureList.some((sig) => header.startsWith(sig)),
  );
};

// Validation des dimensions de l'image
export const validateDimensions = (
  width: number,
  height: number,
  idealWidth: number,
  idealHeight: number,
  format?: ImageFormat,
  idealRatio?: number,
  ratioTolerance?: number,
  maxWidth?: number,
  maxHeight?: number,
  minWidth?: number,
  minHeight?: number,
): string | null => {
  const ratio = width / height;

  if (minWidth && width < minWidth) {
    return ERROR_MESSAGES.tooSmall(minWidth, minHeight ?? 0);
  }

  if (format === 'portrait' && height <= width)
    return ERROR_MESSAGES.badPortrait;
  if (format === 'landscape' && width <= height)
    return ERROR_MESSAGES.badLandscape;

  if (maxWidth && width > maxWidth) {
    return ERROR_MESSAGES.tooBigDimensions(maxWidth, maxHeight ?? 0);
  }

  if (maxHeight && height > maxHeight) {
    return ERROR_MESSAGES.tooBigDimensions(maxWidth ?? 0, maxHeight);
  }

  if (idealRatio && ratioTolerance) {
    const delta = Math.abs(ratio - idealRatio);
    if (delta > ratioTolerance) {
      if (idealRatio == 1) return ERROR_MESSAGES.squareExpected;
      return ERROR_MESSAGES.badRatio(idealWidth, idealHeight);
    }
  }

  return null;
};

export const processAndCompressImage = async (
  file: File,
  options: Required<ImageRuleOptions>,
): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxWeight,
      fileType: options.shouldConvertWebp ? 'image/webp' : file.type,
      initialQuality: 0.9,
      useWebWorker: true,
      maxWidthOrHeight: Math.max(options.maxWidth, options.maxHeight),
      exifOrientation: -1, // Supprime les données EXIF
    });

    const getExtension = (mimeType: string): string => {
      const map: Record<string, string> = {
        'image/webp': 'webp',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
      };
      return map[mimeType] || 'jpg';
    };

    const originalName = file.name;
    const nameWithoutExtension = originalName.substring(
      0,
      originalName.lastIndexOf('.'),
    );

    // Ajouter la bonne extension ✅
    const extension = getExtension(compressedFile.type);
    const finalName = `${nameWithoutExtension}.${extension}`;

    const renamedFile = new File([compressedFile], finalName, {
      type: compressedFile.type,
      lastModified: compressedFile.lastModified,
    });

    return renamedFile;
  } catch (error) {
    console.warn('Erreur lors de la compression initiale:', error);
    return file; // Fallback au fichier original
  }
};

// Fonction principale pour traiter une image
export const processImage = async (
  file: File,
  options: any,
): Promise<{
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  warning: string | null;
}> => {
  try {
    // Vérification du type MIME déclaré
    if (!options.supportedTypes.includes(file.type)) {
      return {
        file: null,
        previewUrl: null,
        error: ERROR_MESSAGES.notImage,
        warning: null,
      };
    }

    // 1. Validation du fichier image
    const isValidImage = await validateImageContent(file);
    if (!isValidImage) {
      return {
        file: null,
        previewUrl: null,
        error: ERROR_MESSAGES.invalidMimeType,
        warning: null,
      };
    }

    // 3. Valider les dimensions
    const img = await createImageBitmap(file);
    const dimensionError = validateDimensions(
      img.width,
      img.height,
      options.idealWidth,
      options.idealHeight,
      options.imgFormat,
      options.idealRatio,
      options.ratioTolerance,
      options.maxWidth,
      options.maxHeight,
      options.minWidth,
      options.minHeight,
    );

    if (dimensionError) {
      return {
        file: null,
        previewUrl: null,
        error: dimensionError,
        warning: null,
      };
    }

    // 4. Compression du fichier / nettoyage EXIF
    const compressedFile = await processAndCompressImage(file, options);

    // Vérifier si la conversion WebP a réussi
    let warning = '';
    if (compressedFile.type !== 'image/webp' && options.shouldConvertWebp) {
      warning = '⚠️ La conversion WebP a échoué';
    }

    // 5 : Vérification du poids après compression
    if (compressedFile.size > options.maxWeight * 1_048_576) {
      return {
        file: null,
        previewUrl: null,
        error: ERROR_MESSAGES.tooLarge(options.maxWeight),
        warning: null,
      };
    }

    // 6. Créer l'URL de prévisualisation
    const previewUrl = URL.createObjectURL(compressedFile);

    // 7. Log des opérations effectuées
    if (import.meta.env.DEV || true) {
      const originalSizeMB = (file.size / 1_048_576).toFixed(2);
      const finalSizeMB = (compressedFile.size / 1_048_576).toFixed(2);
      const conversionDone =
        options.shouldConvertWebp && compressedFile.type === 'image/webp';
      console.log(`Optimisation de l'image : ${file.name}`);
      console.log('- Poids original :', `${originalSizeMB} Mo`);
      console.log('- Poids final :', `${finalSizeMB} Mo`);
      console.log(
        '- Conversion WebP :',
        conversionDone
          ? 'réussie'
          : options.shouldConvertWebp
            ? 'échouée'
            : 'non demandée',
      );
    }

    return {
      file: compressedFile,
      previewUrl,
      error: null,
      warning,
    };
  } catch (error) {
    console.error("Erreur lors du traitement de l'image:", error);
    return {
      file: null,
      previewUrl: null,
      error: ERROR_MESSAGES.processingFailed,
      warning: null,
    };
  }
};
