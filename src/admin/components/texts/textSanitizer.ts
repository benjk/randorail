/**
 * Supprime les balises HTML basiques (ex: <b>, <div>, etc.)
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * Supprime les balises <script> dangereuses
 */
export function removeScriptTags(input: string): string {
  return input.replace(/<script.*?>.*?<\/script>/gi, "");
}

/**
 * Normalise les espaces multiples.
 * Si `preserveLineBreaks` est vrai, garde les \n (utile pour textarea).
 */
export function normalizeWhitespace(input: string, preserveLineBreaks = false): string {
  if (preserveLineBreaks) {
    return input
      .split("\n")
      .map(line => line.replace(/[ \t]+/g, " ").trimEnd())
      .join("\n")
      .trim();
  }

  return input.replace(/\s+/g, " ").trim();
}

/**
 * Trim + nettoyage global pour champ texte classique
 */
export function sanitizeText(input: string, isLineBreakable = false): string {
  return normalizeWhitespace(removeScriptTags(stripHtmlTags(input.trim())), isLineBreakable);
}

/**
 * Sanitize spécifique email : full nettoyage + lowercase
 */
export function sanitizeEmail(input: string): string {
  return sanitizeText(input).toLowerCase();
}
