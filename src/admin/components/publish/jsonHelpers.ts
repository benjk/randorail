import { parseBlocFullKey } from './../blocs/blocHelper';
import { blocRules } from '../../data/blocRules';
import {
  DynamicDataType,
  ImageEntry,
  ModifiedFieldVM,
  MutableProps,
} from './publish.type';

/**
 * Résout le chemin complet dans jsonContent pour un champ d'un bloc (texte ou image)
 */
export function resolveFieldJsonPath(
  editableKey: string,
  type: DynamicDataType,
  originalJsonIndex?: number,
): string | null {
  const parsedKey = parseBlocFullKey(editableKey);
  if (!parsedKey) return null;
  parsedKey.index = originalJsonIndex ?? parsedKey.index;
  const ruleSet = blocRules[parsedKey.blocKey];
  if (!ruleSet) return null;

  const blocPath = ruleSet.jsonKey;
  const blocInstancePath = `${blocPath}.items[${parsedKey.index}]`;

  let propName: string | undefined;

  if (type === DynamicDataType.Text) {
    propName = ruleSet.textFields?.[parsedKey.fieldKey]?.key;
  } else if (type === DynamicDataType.Image) {
    propName = ruleSet.imageFields?.[parsedKey.fieldKey]?.name;
  }

  if (!propName) {
    return null;
  }

  const jsonPath = `${blocInstancePath}.${propName}`;
  return jsonPath;
}

/** Renvoie le chemin json pour une instance de bloc avec son index
 * Format : pages.services.blocs.items[2]
 */
export function resolveBlocJsonPath(
  blocKey: string,
  index: number,
): string | null {
  const ruleSet = blocRules[blocKey];
  if (!ruleSet) return null;

  return `${ruleSet.jsonKey}.items[${index}]`;
}

/** Applique les props mutable à un bloc dans le Json
 * Peut être utilisée pour créer des nouveaux blocs
 */
export function applyMutablePropsToJson(
  blocJsonPath: string,
  props: MutableProps,
  jsonRaw: any,
) {
  for (const [propKey, propValue] of Object.entries(props)) {
    if (propValue === undefined) continue;
    setValueAtPath(jsonRaw, `${blocJsonPath}.${propKey}`, propValue);
  }
}

/** Permet d'éditer le contenu du json qui sera envoyé
 * @obj : Json raw complet
 * @path : chemin dans le json
 * @value : nouvelle valeur à mettre
 */
export function setValueAtPath(
  obj: any,
  path: string,
  value: string | string[],
  isArray = false,
) {
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((p) => (p.match(/^\d+$/) ? parseInt(p, 10) : p));

  const last = parts.pop();
  let target = obj;
  for (const part of parts) {
    if (typeof target[part] !== 'object' || target[part] === null) {
      // Si le parent est un tableau, on suppose que chaque élément est un objet
      target[part] =
        typeof part === 'number' && Array.isArray(target) ? {} : {};
    }
    target = target[part];
  }
  if (last !== undefined) {
    if (isArray) {
      // Assurez-vous que le dernier élément est un tableau et affectez-lui la valeur
      if (!Array.isArray(target[last])) {
        target[last] = [];
      }
      // Remplacez le tableau par la nouvelle valeur
      target[last] = value;
    } else {
      target[last] = value;
    }
  }
}

export function applyArrayValues(
  jsonContent: any,
  rule: any,
  editableKey: string,
  isBloc: boolean,
  fieldsData: ModifiedFieldVM[],
  originalJsonIndex?: number,
): void {
  let basePath: string | null;

  if (!isBloc) {
    // Field duplicable standalone
    basePath = rule.key;
  } else {
    // Field duplicable dans un bloc - utiliser le chemin de base sans l'index
    basePath = resolveFieldJsonPath(
      editableKey,
      fieldsData[0].dataType,
      originalJsonIndex,
    );
  }
  if (!basePath) return;

  // Récupérer le tableau existant du JSON original
  const existingArray = getValueAtJsonPath(jsonContent, basePath) || [];
  console.log(`Existing array for ${basePath}:`, existingArray);

  // Créer le nouveau tableau en partant de l'existant
  const newArray = [...(existingArray as string[])];

  // Ajouter les nouvelles valeurs au tableau
  fieldsData.forEach((field) => {
    if (field.fieldIndex !== undefined) {
      if (field.dataType === DynamicDataType.Image) {
        const imgValue = field.value as ImageEntry;
        newArray[field.fieldIndex] = imgValue.file!.name;
      } else if (field.dataType === DynamicDataType.Text) {
        newArray[field.fieldIndex] = field.value as string;
      }
    }
  });

  // Mettre à jour le tableau dans le JSON
  console.log('MY NEW ARRAY IIIIS : ', newArray);

  setValueAtPath(jsonContent, basePath, newArray, true);
}

export function getValueAtJsonPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    // Gestion des indices d'array comme [0], [1], etc.
    if (key.includes('[') && key.includes(']')) {
      const arrayKey = key.substring(0, key.indexOf('['));
      const index = parseInt(
        key.substring(key.indexOf('[') + 1, key.indexOf(']')),
      );
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

export function removeBlocFromJson(obj: any, path: string) {
  const parts = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((p) => (p.match(/^\d+$/) ? parseInt(p, 10) : p));

  const last = parts.pop();
  let target = obj;

  for (const part of parts) {
    if (target[part] === undefined) {
      return;
    }
    target = target[part];
  }

  if (
    typeof last === 'number' &&
    Array.isArray(target) &&
    last < target.length
  ) {
    target[last] = null;
  }
}

/** Claude CODE (y) */
export function includesValueInScope(obj: any, fullPath: string): boolean {
  // Split le chemin : "services/moi.jpg" -> ["services", "moi.jpg"]
  const pathParts = fullPath.split('/');

  if (pathParts.length < 2) {
    // Si pas de scope défini, utilise l4include globql
    return includesValue(obj, fullPath);
  }

  const scopeName = pathParts[0]; // "services"
  const remainingPath = pathParts.slice(1);
  const fileName = pathParts[pathParts.length - 1];

  const foundScopes = findScopeByName(obj, scopeName);

  for (const { scope, path } of foundScopes) {
    // Si il y a des sous-dossiers dans le chemin (ex: "services/images/rob1.jpg")
    if (remainingPath.length > 1) {
      const subPath = remainingPath.slice(0, -1); // ["images"]
      const subScope = navigateToScope(scope, subPath);

      if (subScope && includesValue(subScope, fileName)) {
        return true;
      }
    } else {
      // Cherche directement dans le scope
      if (includesValue(scope, fileName)) {
        return true;
      }
    }
  }
  return false;
}

// Fonction pour naviguer vers un scope spécifique
function navigateToScope(obj: any, pathParts: string[]): any {
  let current = obj;

  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = current[part];
    } else {
      return null; // Chemin n'existe pas
    }
  }

  return current;
}

// Fonction qui trouve un scope par son nom, peu importe sa profondeur
export function findScopeByName(obj: any, scopeName: string): any[] {
  const results: any[] = [];

  function searchRecursively(current: any, path: string = '') {
    if (
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current)
    ) {
      // Si on trouve une clé qui correspond au scope recherché
      if (scopeName in current) {
        results.push({
          scope: current[scopeName],
          path: path ? `${path}.${scopeName}` : scopeName,
        });
      }

      // Continue la recherche récursivement
      for (const key in current) {
        const newPath = path ? `${path}.${key}` : key;
        searchRecursively(current[key], newPath);
      }
    } else if (Array.isArray(current)) {
      // Parcourt les arrays aussi
      current.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        searchRecursively(item, newPath);
      });
    }
  }

  searchRecursively(obj);
  return results;
}

export function includesValue(obj: any, value: string): boolean {
  if (obj === value) {
    return true;
  }

  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      for (let item of obj) {
        if (includesValue(item, value)) {
          return true;
        }
      }
    } else {
      for (let key in obj) {
        if (includesValue(obj[key], value)) {
          return true;
        }
      }
    }
  }

  return false;
}

/** Fonction pour nettoyer les orders désynchro avant l'envoi au serveur */
export function cleanOrderData(jsonRaw: any): any {
  function realignItems(items: any[]) {
    const withOrder = items.filter(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        'order' in item &&
        typeof item.order === 'number',
    );

    if (withOrder.length === 0) return;

    console.log('🔧 Réalignement des orders...');
    console.log(
      'Avant:',
      withOrder.map((i) => ({ title: i.title || 'no title', order: i.order })),
    );

    // Trier par order existant pour stabilité
    const sorted = [...withOrder].sort((a, b) => a.order - b.order);

    // Réassigner les orders à 1,2,3…
    sorted.forEach((item, idx) => {
      item.order = idx + 1;
    });

    console.log(
      'Après:',
      sorted.map((i) => ({ title: i.title || 'no title', order: i.order })),
    );
  }

  function traverse(obj: any) {
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (key === 'items' && Array.isArray(val)) {
          realignItems(val);
        }
        traverse(val);
      }
    }
  }

  const clone = structuredClone(jsonRaw);
  traverse(clone);
  return clone;
}
