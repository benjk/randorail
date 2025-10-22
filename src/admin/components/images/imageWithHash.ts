import { IMG_PUBLIC_FOLDER } from "./../../../config";
import hashesRaw from "../../../../public/img/hashes.json";

const hashes: Record<string, string> = hashesRaw;

export function imageWithHash(filename: string, folder = IMG_PUBLIC_FOLDER) {
  const hash = hashes[filename];
  const v = hash ? `?v=${hash}` : '';
  return `${folder}${filename}${v}`;
}

