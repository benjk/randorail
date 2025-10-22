import {
  BlocInstanceState,
  MutableProps,
} from '../publish/publish.type';

interface AddInstanceOptions {
  isNew?: boolean;
}

export function createInstanceForBlocGroup(
  blocKey: string,
  index: number,
  originalJsonIndex: number,
  fieldKeys: string[],
  order: number,
  options: AddInstanceOptions = {},
  fieldOrders?: Record<string, number>,
): BlocInstanceState {
  const baseState: MutableProps = { order };

  const instance: BlocInstanceState = {
    // IDs
    index,
    originalJsonIndex,
    blocKey,
    fieldKeys,
    fieldOrders: fieldOrders ? { ...fieldOrders } : {},

    // États dynamiques
    initial: { ...baseState },
    current: { ...baseState },
    toPublish: options.isNew ? { ...baseState } : undefined,

    // Flags de cycle de vie
    isNew: options.isNew ?? false,
    isDeleted: false,
    inError: false,
  };

  return instance;
}
