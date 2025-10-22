import { parseBlocFullKey } from '../blocs/blocHelper';
import { EditableField, EditableFields } from '../publish/publish.type';

const store: EditableFields = {};
/**
 * CRUD BASICS
 */
export const getField = (key: string) => store[key];

export const setField = (key: string, value: EditableField) => {
  store[key] = value;
  notifyField(key);
};

export const updateField = (
  key: string,
  updater: (prev: EditableField) => EditableField,
) => {
  const prev = store[key];
  const next = updater(prev);

  console.log(`Updating field "${key}"`);
  

  if (prev === next) return;
  store[key] = next;
  notifyField(key);
};

export const getAllFields = () => store;

/** Supprime des champs spécifique (1 ou en tableau[]) */
export const deleteFields = (keys: string | string[]) => {
  const keysToDelete = Array.isArray(keys) ? keys : [keys];
  let changed = false;
  keysToDelete.forEach((key) => {
    if (store[key]) {
      delete store[key];
      notifyField(key);
      changed = true;
    }
    console.log(`Field "${key}" deleted from store`);
  });
  return changed;
};

/**
 * SUBSCRIBERS STUFF
 */
const fieldSubscribers = new Map<string, Set<() => void>>();
const globalSubscribers = new Set<() => void>();
const pendingNotifications = new Set<string>();
let isFlushing = false;
const notifyField = (key: string) => {
  pendingNotifications.add(key);
  if (!isFlushing) {
    isFlushing = true;
    queueMicrotask(() => {
      pendingNotifications.forEach((k) => {
        fieldSubscribers.get(k)?.forEach((cb) => cb());
      });
      globalSubscribers.forEach((cb) => cb());
      pendingNotifications.clear();
      isFlushing = false;
    });
  }
};

export const subscribeFields = (
  keysOrKey: string | string[],
  cb: () => void,
): (() => void) => {
  const keys = Array.isArray(keysOrKey) ? keysOrKey : [keysOrKey];

  const unsubscribes = keys.map((key) => {
    if (!fieldSubscribers.has(key)) fieldSubscribers.set(key, new Set());
    fieldSubscribers.get(key)!.add(cb);

    return () => {
      fieldSubscribers.get(key)!.delete(cb);
      if (fieldSubscribers.get(key)!.size === 0) {
        fieldSubscribers.delete(key);
      }
    };
  });

  return () => unsubscribes.forEach((fn) => fn());
};

export const subscribeAllFields = (cb: () => void) => {
  globalSubscribers.add(cb);
  return () => {
    globalSubscribers.delete(cb);
  };
};

/**
 * SUPER GETTERS
 */
/** Donne une list de keys de champs qui match avec un filtre donné */
export const getKeysMatching = (filterFn: (key: string) => boolean): string[] => {
  return Object.keys(store).filter(filterFn);
};

/** Permet de récupérer tous les fields du store associé à la route ROUTE */
export const getFieldsForRoute = (route: string): EditableFields => {
  return Object.entries(store)
    .filter(([, field]) => field?.associatedRoute === route)
    .reduce((acc, [key, field]) => {
      acc[key] = field;
      return acc;
    }, {} as EditableFields);
};

/** Renvoie la liste des fields duplicables pour une key donné (= les fields dupliqués dans un même bloc) */
export const getCleanDuplicableFieldInstances = (currentFieldKey: string) => {
  const parsedKey = parseBlocFullKey(currentFieldKey);
  if (!parsedKey) return [];
  
  const { blocKey, fieldKey, index: blocIndex } = parsedKey;
  
  return getKeysMatching((key) => {    
    const parsedOther = parseBlocFullKey(key);
    if (!parsedOther) return false;
    
    // Même fieldKey et même bloc
    if (parsedOther.fieldKey !== fieldKey || parsedOther.index !== blocIndex || blocKey !== parsedOther.blocKey) {
      return false;
    }
    
    // Exclure les fields deleted on GARDE les field en error
    const field = getField(key);
    return !field?.isDeleted;
  });
};

/** Format de return de @getCleanModifiedFields */
type ModifiedResult = {
  modifiedFields: EditableFields;
  deletedFields: EditableFields;
  createdFields: EditableFields;
};
/** Track les modifs du store et renvoie listes de fields
 * Les modified qui contiennent update ET new fields
 * Utilisé pour le publish ou pour l'affichage : ne prend pas en comptel es champs inError
 * Les deleted fields
 */
export const getCleanModifiedFields = (): ModifiedResult => {
  const modified: EditableFields = {};
  const deleted: EditableFields = {};
  const created: EditableFields = {};

  for (const key in store) {

    
    const field = store[key];
    if (!field) continue;
    
    if (field.isDeleted) {
      deleted[key] = field;
      continue;
    }

    const inError = field.inError;

    if (field.isNew && !inError) {
      created[key] = field;
      continue;
    }

    if (field.toPublish === undefined) continue;

    const initial = field.initial || {};
    const toPublish = field.toPublish;

    const hasDiff = Object.entries(toPublish).some(
      ([k, v]) => !(k in initial) || v !== initial[k as keyof typeof initial],
    );

    if (hasDiff) {
      if (!inError) {
        modified[key] = field;
      }
    }
  }

  return { modifiedFields: modified, deletedFields: deleted , createdFields: created};
};

/** Récupère les fields qui ont été modifiés (même ceux en erreur) */
export const getFieldsToRollback = (): EditableFields => {
  const fieldsToRollback: EditableFields = {};

  for (const key in store) {
    const field = store[key];
    if (!field) continue;


    // Field supprimé ou créé = besoin de rollback
    if (field.isDeleted === true || field.isNew === true) {
      fieldsToRollback[key] = field;
      continue;
    }

    // Pas de toPublish = pas de rollback nécessaire
    if (field.toPublish === undefined) continue;

    const initial = field.initial || {};
    const toPublish = field.toPublish;

    // Vérifier les différences entre initial et toPublish
    const hasDiff = Object.entries(toPublish).some(([k, v]) => {
      if (!(k in initial)) {
        return true;
      }
      
      const initialValue = initial[k as keyof typeof initial];
      return v !== initialValue;
    });

    if (hasDiff) {
      fieldsToRollback[key] = field;
    }
  }

  return fieldsToRollback;
};

/** Retourne tous les fields qui commencent par un bloc autorisé et contiennent _TITLE
 * UTtilisé pour écouter les modifs sur les titres depuis un blocPicker et màj l'affichage dans le select
 */
export const getTitleFieldsForBlocKeys = (allowedBlocKeys: string[]): EditableFields => {
  const result: EditableFields = {};

  Object.entries(store).forEach(([key, field]) => {
    if (!field) return;

    const matchesBloc = allowedBlocKeys.some((blocKey) => key.startsWith(blocKey));
    const isTitleField = key.includes('_TITLE');

    if (matchesBloc && isTitleField) {
      result[key] = field;
    }
  });

  return result;
};
