import { BlocPickerState } from '../publish/publish.type';

const blocPickers: Record<string, BlocPickerState> = {};
const globalPickerSubscribers = new Set<() => void>();
const pickerSubscribersByKey = new Map<string, Set<() => void>>();

/**
 * 🔔 Notifications
 */
const notifyPickerChanged = (key: string) => {
  const subscribers = pickerSubscribersByKey.get(key);
  if (subscribers) subscribers.forEach((cb) => cb());
  globalPickerSubscribers.forEach((cb) => cb());
};

const notifyAllPickers = () => {
  for (const subscribers of pickerSubscribersByKey.values()) {
    subscribers.forEach((cb) => cb());
  }
  globalPickerSubscribers.forEach((cb) => cb());
};

/**
 * 🧩 CRUD
 */
export const setBlocPicker = (pickerKey: string, state: BlocPickerState) => {
  blocPickers[pickerKey] = state;
  notifyPickerChanged(pickerKey);
};

export const getBlocPicker = (pickerKey: string): BlocPickerState | undefined =>
  blocPickers[pickerKey];

export const updateBlocPicker = (
  pickerKey: string,
  updater: (prev: BlocPickerState) => BlocPickerState,
) => {
  const current = blocPickers[pickerKey];
  if (!current) return;
  blocPickers[pickerKey] = updater(current);
  notifyPickerChanged(pickerKey);
};

export const getAllBlocPickers = (): Record<string, BlocPickerState> => ({
  ...blocPickers,
});

export const setAllBlocPickers = (
  newPickers: Record<string, BlocPickerState>,
) => {
  for (const key in blocPickers) delete blocPickers[key];
  Object.assign(blocPickers, newPickers);
  notifyAllPickers();
};

/**
 * 🔍 Modified pickers
 */
export const getModifiedBlocPickers = (): BlocPickerState[] => {
  return Object.values(blocPickers).filter(
    (picker) =>
      picker.toPublish &&
      (picker.toPublish.enabled !== picker.initial.enabled ||
        picker.toPublish.sourceBlocKey !== picker.initial.sourceBlocKey ||
        picker.toPublish.blocIndex !== picker.initial.blocIndex),
  );
};

/**
 * 🧠 Subscriptions
 */
export const subscribeBlocPicker = (
  pickerKey: string,
  cb: () => void,
): (() => void) => {
  if (!pickerSubscribersByKey.has(pickerKey))
    pickerSubscribersByKey.set(pickerKey, new Set());

  const setForKey = pickerSubscribersByKey.get(pickerKey)!;
  setForKey.add(cb);

  return () => {
    setForKey.delete(cb);
    if (setForKey.size === 0) pickerSubscribersByKey.delete(pickerKey);
  };
};

export const subscribeAllBlocPickers = (cb: () => void): (() => void) => {
  globalPickerSubscribers.add(cb);
  return () => globalPickerSubscribers.delete(cb);
};
