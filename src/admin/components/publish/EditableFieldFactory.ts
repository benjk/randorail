import {
  EditableField,
  EditableValue,
  EditableFieldOptions,
  MutableProps,
} from './publish.type';

export const makeEditableField = (
  key: string,
  value: EditableValue,
  options: EditableFieldOptions & Partial<MutableProps>,
  order?: number
): EditableField => {
  const mutableProps: MutableProps = {
    order: order,
  };

  const makeState = (val: EditableValue) => ({
    ...mutableProps,
    value: val,
  });

  const field: EditableField = {
    // Options figées
    dataType: options.dataType,
    partOfBloc: options.partOfBloc ?? false,
    blocKey: options.blocKey,
    label: options.label ?? key,
    isGenerated: options.isGenerated ?? false,
    associatedRoute: options.associatedRoute,

    // États dynamiques
    initial: makeState(structuredClone(value)),
    current: makeState(value),
    toPublish: options.isGenerated
      ? makeState(structuredClone(value))
      : undefined,

    // Flags de cycle de vie
    isNew: options.isNew ?? false,
    isDeleted: options.isDeleted ?? false,
    inError: options.inError ?? false,
    fieldIndex: options.fieldIndex,
  };

  return field;
};
