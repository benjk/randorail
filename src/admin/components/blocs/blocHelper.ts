import { BlocItemValues, ParsedBlocKey } from '../publish/publish.type';
import { BlocRule } from './blocRulesFactory';

/** Prends une key d'un item de bloc et la découpe */
export const parseBlocFullKey = (key: string): ParsedBlocKey => {
  const parts = key.split('.');
  if (parts.length !== 3 && parts.length !== 4) return null;

  const [blocKey, fieldKey, indexStr, fieldIndexStr] = parts;
  const index = parseInt(indexStr, 10);
  if (isNaN(index)) return null;

  if (parts.length === 4) {
    const fieldIndex = parseInt(fieldIndexStr!, 10);
    if (isNaN(fieldIndex)) return null;
    return { blocKey, fieldKey, index, fieldIndex, fullKey: key };
  }

  return { blocKey, fieldKey, index, fullKey: key };
};

/** Créé une key d'un item de bloc à partir de ses keys et index */
export const makeFullKeyForBlocItem = (
  blocKey: string,
  fieldKey: string,
  index: number,
  fieldIndex?: number,
): string => {
  if (fieldIndex !== undefined) {
    return `${blocKey}.${fieldKey}.${index}.${fieldIndex}`;
  }
  return `${blocKey}.${fieldKey}.${index}`;
};

export const resolveBlocItems = (
  root: any,
  path: string,
): BlocItemValues[] | null => {
  const parts = path.split('.');
  let current = root;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return null;
    current = current[part];
  }

  // Cas normal avec "items"
  if (current && Array.isArray(current.items))
    return current.items as BlocItemValues[];
  // fallback si blocs contient direct le tableau sans "items"
  if (Array.isArray(current)) return current as BlocItemValues[];
  return null;
};

/** ItemKeys builder : Tri et return string  */
export const getSortedFieldKeys = (
  fieldKeys: string[],
  blocRule: BlocRule,
): string[] => {
  // Fonction helper pour récupérer le rank d'une key
  const getRankForKey = (fullKey: string): number | null => {
    const logicalKey = parseBlocFullKey(fullKey)?.fieldKey;
    if (!logicalKey) return null;

    if (blocRule.textFields[logicalKey]?.rank !== undefined) {
      return blocRule.textFields[logicalKey].rank;
    }

    if (blocRule.imageFields[logicalKey]?.rank !== undefined) {
      return blocRule.imageFields[logicalKey].rank;
    }

    return null;
  };

  return fieldKeys
    .map((fullKey) => ({
      fullKey,
      rank: getRankForKey(fullKey),
    }))
    .sort((a, b) => {
      const rankA = typeof a.rank === 'number' && a.rank > 0 ? a.rank : null;
      const rankB = typeof b.rank === 'number' && b.rank > 0 ? b.rank : null;

      if (rankA !== null && rankB !== null) return rankA - rankB;
      if (rankA !== null && rankB === null) return -1;
      if (rankA === null && rankB !== null) return 1;
      return 0;
    })
    .map((item) => item.fullKey);
};

export const getBlocIndice = (index: number, order?: number) => {
  const blocIndice = index + 1;
  return blocIndice;
};

export function getGroupId(parsedKey: { blocKey: string; index: number; fieldKey: string }): string {
  return `${parsedKey.blocKey}-${parsedKey.index}-${parsedKey.fieldKey}`;
}

