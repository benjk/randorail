import {
  BlocGroupInfo,
  BlocGroups,
  BlocInstanceState,
  FieldKeyWithOrder,
} from '../publish/publish.type';

const blocStore: BlocGroups = {};
const globalBlocSubscribers = new Set<() => void>();
const blocSubscribersByKey = new Map<string, Set<() => void>>();

/**
 * SUBSCRIBERS STUFF
 */
export const subscribeBlocs = (
  keysOrKey: string | string[],
  cb: () => void,
): (() => void) => {
  const keys = Array.isArray(keysOrKey) ? keysOrKey : [keysOrKey];

  const unsubscribes = keys.map((key) => {
    if (!blocSubscribersByKey.has(key))
      blocSubscribersByKey.set(key, new Set());
    blocSubscribersByKey.get(key)!.add(cb);

    return () => {
      const setForKey = blocSubscribersByKey.get(key);
      if (!setForKey) return;
      setForKey.delete(cb);
      if (setForKey.size === 0) {
        blocSubscribersByKey.delete(key);
      }
    };
  });

  return () => unsubscribes.forEach((unsub) => unsub());
};

export const subscribeBlocAll = (cb: () => void) => {
  globalBlocSubscribers.add(cb);
  return () => globalBlocSubscribers.delete(cb);
};

const notifyBlocChanged = (key: string) => {
  const subscribers = blocSubscribersByKey.get(key);
  if (subscribers) {
    subscribers.forEach((cb) => cb());
  }
  globalBlocSubscribers.forEach((cb) => cb());
};

const notifyAllBlocs = () => {
  for (const key of blocSubscribersByKey.keys()) {
    const subscribers = blocSubscribersByKey.get(key);
    if (subscribers) {
      subscribers.forEach((cb) => cb());
    }
  }
  globalBlocSubscribers.forEach((cb) => cb());
};

/**
 * CRUD BASICS
 */
export const setBlocGroup = (key: string, value: BlocGroupInfo) => {
  blocStore[key] = value;
  notifyBlocChanged(key);
};

export const getBlocGroup = (key: string): BlocGroupInfo => blocStore[key];

export const getAllBlocGroups = (): Record<string, BlocGroupInfo> => {
  return { ...blocStore };
};

export const setAllBlocGroups = (groups: Record<string, BlocGroupInfo>) => {
  // Remplace tout le store
  for (const key in blocStore) {
    delete blocStore[key]; // Clear ancien contenu
  }
  Object.assign(blocStore, groups);
  notifyAllBlocs();
};

export const getBlocInstance = (blocKey: string, blocIndex: number) => {
  return getBlocGroup(blocKey).blocInstances[blocIndex]
}

/**
 * CRUD FOR INSTANCES
 */

export function setInstanceToGroup(
  blocKey: string,
  instance: BlocInstanceState,
): void {
  const group = getBlocGroup(blocKey) ?? { blocInstances: {} };
  group.blocInstances[instance.index] = instance;
  setBlocGroup(blocKey, group);
}

export function deleteInstanceFromGroup(blocKey: string, index: number): void {
  const group = getBlocGroup(blocKey);
  if (!group) return;

  const updatedGroup = {
    ...group,
    blocInstances: { ...group.blocInstances },
  };

  delete updatedGroup.blocInstances[index];
  setBlocGroup(blocKey, updatedGroup);
}

export function updateBlocInstance(
  blocKey: string,
  index: number,
  updater: (prev: BlocInstanceState) => BlocInstanceState,
): void {
  const group = getBlocGroup(blocKey);
  if (!group || !(index in group.blocInstances)) return;

  const updatedGroup = {
    ...group,
    blocInstances: { ...group.blocInstances },
  };

  updatedGroup.blocInstances[index] = updater(
    updatedGroup.blocInstances[index],
  );
  setBlocGroup(blocKey, updatedGroup);
}

export const updateBlocError = (
  blocKey: string,
  index: number,
  isError: boolean,
) => {
  const blocGroup = getBlocGroup(blocKey).blocInstances[index];
  if (!blocGroup) return;
  blocGroup.inError = isError;
  notifyBlocChanged(blocKey);
};

export function deleteBlocInstance(blocKey: string, index: number): void {
  const group = getBlocGroup(blocKey);
  if (!group) return;

  if (!(index in group.blocInstances)) return;

  const updatedGroup = {
    ...group,
    blocInstances: { ...group.blocInstances },
  };

  delete updatedGroup.blocInstances[index];
  setBlocGroup(blocKey, updatedGroup);
}

export function markInstanceAsDeleted(blocKey: string, index: number): void {
  const group = getBlocGroup(blocKey);
  if (!group || !(index in group.blocInstances)) return;
  group.blocInstances[index].isDeleted = true;
  notifyBlocChanged(blocKey);
}

export const updateBlocOrders = (updates: FieldKeyWithOrder[]) => {
  const updatesByBlocKey = new Map<string, FieldKeyWithOrder[]>();

  // On regroupe les updates par blocKey pour éviter des notifs multiples inutiles
  updates.forEach((update) => {
    const blocKey = update.blocKey;
    if (!blocKey) return;

    if (!updatesByBlocKey.has(blocKey)) {
      updatesByBlocKey.set(blocKey, []);
    }
    updatesByBlocKey.get(blocKey)!.push(update);
  });

  updatesByBlocKey.forEach((updatesForKey, blocKey) => {
    const blocGroup = getBlocGroup(blocKey);
    if (!blocGroup) return;

    updatesForKey.forEach(({ index, order }) => {
      const bloc = blocGroup.blocInstances[index];
      if (bloc) {
        bloc.toPublish = {
          ...bloc.toPublish,
          order,
        };
        bloc.current.order = order;
      }
    });
    notifyBlocChanged(blocKey);
  });
};

export const deleteFieldKeyFromInstance = (
  blocKey: string,
  index: number,
  fieldKey: string,
) => {
  const group = getBlocGroup(blocKey);
  if (!group) return;

  const instance = group.blocInstances[index];
  if (!instance) return;

  const originalLength = instance.fieldKeys.length;
  instance.fieldKeys = instance.fieldKeys.filter((key) => key !== fieldKey);

  if (instance.fieldKeys.length !== originalLength) {
    notifyBlocChanged(blocKey);
  }
};

export const addFieldKeyToBlocInstance = (
  blocKey: string,
  blocIndex: number,
  fieldKey: string,
  order?: number,
) => {
  const group = getBlocGroup(blocKey);
  if (!group) return;

  const instance = group.blocInstances[blocIndex];
  if (!instance) return;

  if (!instance.fieldKeys.includes(fieldKey)) {
    instance.fieldKeys.push(fieldKey);

    if (order !== undefined) {
      if (!instance.fieldOrders) {
        instance.fieldOrders = {};
      }
      instance.fieldOrders[fieldKey] = order;
    }
    notifyBlocChanged(blocKey);
  }
};

export const updateFieldOrdersForBlocInstance = (
  blocKey: string,
  blocIndex: number,
  fieldOrderUpdates: { fieldFullKey: string; order: number }[]
) => {
  const group = getBlocGroup(blocKey);
  if (!group) return;

  const instance = group.blocInstances[blocIndex];
  if (!instance) return;

  if (!instance.fieldOrders) {
    instance.fieldOrders = {};
  }

  fieldOrderUpdates.forEach(({ fieldFullKey, order }) => {
    instance.fieldOrders![fieldFullKey] = order;
  });

  notifyBlocChanged(blocKey);
};

/**
 * SUPER GETTERS
 */
type BlocModifications = {
  createdBlocs: BlocInstanceState[];
  deletedBlocs: BlocInstanceState[];
  modifiedBlocInstances: BlocInstanceState[];
};

export const getModifiedBlocs = (): BlocModifications => {
  const createdBlocs: BlocInstanceState[] = [];
  const deletedBlocs: BlocInstanceState[] = [];
  const modifiedBlocInstances: BlocInstanceState[] = [];

  for (const group of Object.values(blocStore)) {
    for (const bloc of Object.values(group.blocInstances)) {
      if (bloc.isDeleted) {
        deletedBlocs.push(bloc);
        continue;
      }

      if (bloc.isNew && !bloc.inError) {
        createdBlocs.push(bloc);
        continue;
      }

      const toPublish = bloc.toPublish;
      const initial = bloc.initial ?? {};

      if (!toPublish) continue;

      const hasDiff = Object.entries(toPublish).some(
        ([k, v]) => !(k in initial) || v !== (initial as any)[k],
      );

      if (hasDiff) {
        modifiedBlocInstances.push(bloc);
      }
    }
  }

  return { createdBlocs, deletedBlocs, modifiedBlocInstances };
};
