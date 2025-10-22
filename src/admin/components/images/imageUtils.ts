import pica from "pica";

// Generate all icons except ICO
export const generateFavicons = async (file: File): Promise<{ name: string, blob: Blob }[]> => {
  const sizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon.png", size: 512 },
  ];

  const loadImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  const p = pica();
  const baseImage = await loadImage(file);

  const generate = async ({ name, size }: { name: string; size: number }) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    
    // Important : fond transparent pour PNG
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, size, size);
    
    await p.resize(baseImage, canvas, {
      unsharpAmount: 80,
      unsharpThreshold: 2,
    });
    
    // Force PNG avec qualité
    const blob = await p.toBlob(canvas, "image/png", 0.92);
    return { name, blob };
  };

  return Promise.all(sizes.map(generate));
};

export function inferMimeType(filename: string): string | undefined {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.ico')) return 'image/x-icon';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  return undefined;
}

export function buildImagePath(rule: any, fileName: string): string {
  const cleanedFolder = rule.folder
    ?.replace(/^\/?/, '')
    .replace(/^img\/?/, '')
    .replace(/\/$/, '');
  return cleanedFolder ? `${cleanedFolder}/${fileName}` : fileName;
}

/** Vire le numéro de version en fin de fileName */
export function cleanFileName(filePath: string) {
  return filePath.split('?')[0];
}

export function getImageNameFromFullPath(fullPath: string): string {
  const parts = fullPath.split('/');
  return parts[parts.length - 1];
}
