export function formatFrenchPhone(phone: string): { href: string; display: string } {
  const href = phone.replace(/^0/, '+33').replace(/\D/g, ''); // pour le tel: +33xxxxxxx
  const display = phone
    .replace(/\D/g, '')             // retire tout sauf chiffres
    .replace(/(..?)/g, '$1 ')       // espace tous les 2 chiffres
    .trim()
    .replace(/(\s)/g, '.')          // remplace espace par point
    .replace(/\.$/, '');            // retire point final

  return { href, display };
}

