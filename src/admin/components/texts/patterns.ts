import { TextPatternType } from "./textRulesFactory";

export const patternsByTextType: Record<
  TextPatternType,
  { pattern: RegExp; formatInfo: string }
> = {
  text: {
    pattern: /^[\s\S]*$/, // Accepte tout, y compris les chaînes vides
    formatInfo: "",
  },
  email: {
    // - Support pour les caractères spéciaux dans la partie locale
    // - Vérification plus stricte des domaines (TLD de 2-63 caractères)
    // - Support pour les domaines internationaux
    pattern:
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/,
    formatInfo: "Doit être un mail",
  },
  url: {
    // - Support pour les protocoles (http, https, ftp)
    // - Validation des noms de domaine
    // - Support pour les chemins, paramètres et fragments
    pattern:
      /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i,
    formatInfo: "URL valide",
  },
  phone: {
    // - Support pour formats internationaux (+XXX)
    // - Accepte différents séparateurs (espaces, tirets, parenthèses)
    // - Minimum 8 chiffres, maximum 15 (norme E.164)
    pattern:
      /^(?:\+?\d{1,4}[-. ]?)?\(?(?:\d{1,3})\)?[-. ]?(?:\d{1,4})[-. ]?(?:\d{1,4})(?:[-. ]?\d{1,9})?$/,
    formatInfo: "Doit être un numéro de téléphone",
  },
  number: {
    pattern: /^[+-]?(?:\d{1,3}(?: \d{3})*|\d+)$/,
    formatInfo: "Nombre valide",
  },
};
