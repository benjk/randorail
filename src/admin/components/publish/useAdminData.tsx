import React, {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  useEffect,
  useSyncExternalStore,
} from 'react';
import {
  EditableFields,
  EditableField,
  ImageEntry,
  DynamicDataType,
  EditableValue,
  EditableGroup,
  FieldKeyWithOrder,
  BlocGroups,
  EditableFieldOptions,
  BlocGroupInfo,
  ModifiedBlocVM,
  ModifiedFieldVM,
  EnrichedBlocItem,
  BlocInstanceState,
  BlocPickerState,
  BlocPickerValue,
  VideoEntry,
} from './publish.type';
import { textRules } from '../../data/textRules';
import { imageRules } from '../../data/imageRules';
import { blocRules } from '../../data/blocRules';
import { TextRule } from '../texts/textRulesFactory';
import { BLOC_PICKER_RULES } from '../../data/blocPickerRules';
import rawContent from '../../../data/content.json';
import { imageWithHash } from '../images/imageWithHash';
import {
  isValidTextField,
  isValidImageField,
  isValidVideoField,
} from './contentUtils';
import { sanitizeEmail, sanitizeText } from '../texts/textSanitizer';
import { makeEditableField } from './EditableFieldFactory';
import {
  makeFullKeyForBlocItem,
  parseBlocFullKey,
  resolveBlocItems,
} from '../blocs/blocHelper';
import * as fieldStore from '../commons/fieldStore';
import * as blocStore from '../commons/blocStore';
import * as blocPickerStore from '../commons/blocPickerStore';
import { createInstanceForBlocGroup } from '../blocs/blocItemFactory';
import { BaseRule } from '../commons/BaseRule';
import ReactDOM from 'react-dom';
import { videoRules } from '../../data/videoRules';

/** Hook pour accéder aux données administratives */
type AdminDataContextType = {
  fields: {
    getField: (key: string) => EditableField | undefined;
    setEditableValue: (
      key: string,
      value: EditableValue,
      specificRules: BaseRule,
      isValid?: boolean,
    ) => void;
    createNewField: (
      key: string,
      fieldOptions: EditableFieldOptions,
      value?: EditableValue,
    ) => void;
    subscribeFields: (key: string[], callback: () => void) => () => void;
    useFieldStore: (key: string) => {
      field: EditableField;
      currentValue: EditableValue;
      initialValue: EditableValue;
    };
    deleteFields: (keys: string) => void;
    addDuplicableField: (
      targetKey: string,
      blocKey: string,
      blocIndex: number,
      fieldKey: string,
      order: number,
    ) => Promise<string | null>;
    updateFieldsOrder: (orderedFields: FieldKeyWithOrder[]) => void;
    getFieldTitleForBlocs: (allowedBlocKeys: string[]) => EditableFields;
  };
  snapshots: {
    getGlobalsSnapshot: () => EditableGroup[];
    getContactSnapshot: () => EditableGroup[];
    getPageSnapshot: (route: string) => EditableGroup[];
    rollbackCount: number;
  };
  publish: {
    updateDataAfterPublish: () => void;
    getModifiedFields: () => {
      modifiedTextFields: ModifiedFieldVM[];
      modifiedImageFields: ModifiedFieldVM[];
      modifiedBlocs: ModifiedBlocVM[];
    };
  };
  rollback: {
    rollbackToInitial: () => void;
  };
  uiHooks: {
    useHasChanges: () => boolean;
    useBlocInstanceError: (blocKey: string, index: number) => boolean;
    useModifiedFields: () => {
      modifiedTextFields: ModifiedFieldVM[];
      modifiedImageFields: ModifiedFieldVM[];
      modifiedBlocs: ModifiedBlocVM[];
      modifiedBlocPickers: BlocPickerState[];
    };
    useAllCleanDuplicableFieldInstances: (fieldKeys: string[]) => number[];
  };
  raw: {
    jsonContent: string;
    updateJsonContent: (newContent: string) => void;
  };
  blocs: {
    getBlocGroup: (key: string) => BlocGroupInfo;
    deleteBloc: (blocKey: string, index: number, itemKeys: string[]) => void;
    addBlocInstance: (
      blocKey: string,
      index: number,
      fieldKeys: string[],
      order: number,
    ) => void;
    subscribeBlocs: (key: string[], callback: () => void) => () => void;
    updateBlocOrders: (orderedFields: FieldKeyWithOrder[]) => void;
  };
  blocPickers: {
    getBlocPicker: (key: string) => BlocPickerState | undefined;
    setBlocPickerValue: (key: string, value: BlocPickerValue) => void;
    subscribeBlocPicker: (key: string, callback: () => void) => () => void;
    useBlocPickerStore: (key: string) => {
      picker: BlocPickerState;
      currentValue: BlocPickerValue;
      initialValue: BlocPickerValue;
    };
  };
};
const AdminDataContext = createContext<AdminDataContextType>(null!);

/** Déclaration du Provider et de ses méthodes externes */
export const AdminDataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Le fichier content.json accessible ici :
  const [jsonContent, setJsonContent] = useState(JSON.stringify(rawContent));
  const [rollbackCount, setRollbackCount] = useState(0);

  const initialized = useRef(false);

  /** Fonction d'initialisation des champs dynamiques
   * Basée sur les textRules, imageRules, blocRules et le content.json
   * Crée les champs dans le store avec les valeurs initiales
   */
  const initializeEditableFields = async (): Promise<void> => {
    if (!rawContent) return;
    // TEXT RULES
    Object.entries(textRules).forEach(([key, rule]) => {
      const path = rule.key;
      const value = path
        .split('.')
        .reduce((acc: any, part: string) => acc?.[part], rawContent);
      if (value === undefined) {
        console.warn(
          `[INIT] Champ texte "${key}" introuvable dans rawContent à path "${path}"`,
        );
      }
      if (typeof value === 'string') {
        fieldStore.setField(
          key,
          makeEditableField(key, value, {
            dataType: DynamicDataType.Text,
            label: rule.label ?? key,
            associatedRoute: rule.linkTo?.route,
          }),
        );
      }
    });

    // IMAGE RULES
    Object.entries(imageRules).forEach(([key, rule]) => {
      if (!rule.name) return;
      const url = imageWithHash(rule.name, rule.folder);
      const image: ImageEntry = {
        file: undefined,
        previewUrl: url,
        remoteUrl: rule.name,
      };
      fieldStore.setField(
        key,
        makeEditableField(key, image, {
          dataType: DynamicDataType.Image,
          label: rule.label ?? key,
          associatedRoute: rule.linkTo?.route,
        }),
      );
    });

    // VIDEO RULES
    Object.entries(videoRules).forEach(([key, rule]) => {
      if (!rule.name) return;
      const url = imageWithHash(rule.name, rule.folder);
      const video: VideoEntry = {
        file: undefined,
        previewUrl: url,
        remoteUrl: rule.name,
      };
      fieldStore.setField(
        key,
        makeEditableField(key, video, {
          dataType: DynamicDataType.Video,
          label: rule.label ?? key,
          associatedRoute: rule.linkTo?.route,
        }),
      );
    });

    // BLOC RULES
    const blocGroups: BlocGroups = {};
    Object.entries(blocRules).forEach(([blocKey, blocRule]) => {
      const textFields = blocRule.textFields;
      const imageFields = blocRule.imageFields;

      const blocItems = resolveBlocItems(rawContent, blocRule.jsonKey);
      if (!Array.isArray(blocItems)) return;

      // Création des instances de blocs sans leurs instances
      blocGroups[blocKey] = {
        blocKey,
        rule: blocRule,
        blocInstances: {},
      };

      const enrichedBlocItems: EnrichedBlocItem[] = blocItems.map(
        (item, originalIndex) => ({
          ...item,
          originalJsonIndex: originalIndex,
        }),
      );

      const sortedBlocItems = [...enrichedBlocItems].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );

      sortedBlocItems.forEach((blocItem, index) => {
        const { originalJsonIndex } = blocItem;
        let fieldKeys: string[] = [];
        const fieldOrders: Record<string, number> = {};

        // TEXT FIELDS
        if (textFields) {
          Object.entries(textFields).forEach(([fieldKey, textRule]) => {
            const value = blocItem[textRule.key];
            // Cas d'un field duplicable
            if (textRule.isDuplicable && Array.isArray(value)) {
              value.forEach((item, fieldIndex) => {
                const compositeKey = makeFullKeyForBlocItem(
                  blocKey,
                  fieldKey,
                  index,
                  fieldIndex,
                );
                fieldKeys.push(compositeKey);
                const fieldOrder = fieldIndex + 1;
                fieldOrders[compositeKey] = fieldOrder;
                fieldStore.setField(
                  compositeKey,
                  makeEditableField(
                    compositeKey,
                    item,
                    {
                      dataType: DynamicDataType.Text,
                      label: textRule.label ?? fieldKey,
                      partOfBloc: true,
                      blocKey,
                      associatedRoute: textRule.linkTo?.route,
                      fieldIndex: fieldIndex,
                    },
                    fieldOrder,
                  ),
                );
              });
            } else if (typeof value === 'string' && value.trim() !== '') {
              const compositeKey = makeFullKeyForBlocItem(
                blocKey,
                fieldKey,
                index,
              );
              fieldKeys.push(compositeKey);
              fieldStore.setField(
                compositeKey,
                makeEditableField(compositeKey, value, {
                  dataType: DynamicDataType.Text,
                  label: textRule.label ?? fieldKey,
                  partOfBloc: true,
                  blocKey,
                  associatedRoute: textRule.linkTo?.route,
                }),
              );
            }
          });
        }

        // IMAGE FIELDS
        if (
          imageFields &&
          typeof imageFields === 'object' &&
          Object.keys(imageFields).length > 0
        ) {
          Object.entries(imageFields).forEach(([fieldKey, imageRule]) => {
            const imageName = blocItem[imageRule.name];

            if (imageRule.isDuplicable && Array.isArray(imageName)) {
              imageName.forEach((item, fieldIndex) => {
                const url = imageWithHash(item, imageRule.folder);

                const compositeKey = makeFullKeyForBlocItem(
                  blocKey,
                  fieldKey,
                  index,
                  fieldIndex,
                );
                fieldKeys.push(compositeKey);
                const fieldOrder = fieldIndex + 1;
                fieldOrders[compositeKey] = fieldOrder;
                const image: ImageEntry = {
                  file: undefined,
                  previewUrl: url,
                  remoteUrl: item,
                };
                fieldStore.setField(
                  compositeKey,
                  makeEditableField(
                    compositeKey,
                    image,
                    {
                      dataType: DynamicDataType.Image,
                      label: imageRule.label ?? fieldKey,
                      partOfBloc: true,
                      blocKey,
                      associatedRoute: imageRule.linkTo?.route,
                      fieldIndex: fieldIndex,
                    },
                    fieldOrder,
                  ),
                );
              });
            } else {
              const url = imageWithHash(imageName, imageRule.folder);
              const compositeKey = makeFullKeyForBlocItem(
                blocKey,
                fieldKey,
                index,
              );
              fieldKeys.push(compositeKey);
              const image: ImageEntry = {
                file: undefined,
                previewUrl: url,
                remoteUrl: imageName,
              };

              fieldStore.setField(
                compositeKey,
                makeEditableField(compositeKey, image, {
                  dataType: DynamicDataType.Image,
                  label: imageRule.label ?? fieldKey,
                  partOfBloc: true,
                  blocKey,
                  associatedRoute: imageRule.linkTo?.route,
                }),
              );
            }
          });
        }

        const blocInstance = createInstanceForBlocGroup(
          blocKey,
          index,
          originalJsonIndex,
          fieldKeys,
          blocItem.order,
          undefined,
          fieldOrders,
        );
        blocGroups[blocKey].blocInstances[index] = blocInstance;
        blocStore.setAllBlocGroups(blocGroups);
      });
    });

    Object.entries(BLOC_PICKER_RULES).forEach(([pickerKey, rule]) => {
      const value = rule.jsonKey
        .split('.')
        .reduce((acc: any, part: string) => acc?.[part], rawContent);

      const initialValue: BlocPickerValue = value || {
        enabled: false,
        sourceBlocKey: '',
        blocIndex: 0,
      };

      blocPickerStore.setBlocPicker(pickerKey, {
        pickerKey,
        rule,
        initial: initialValue,
        current: initialValue,
        toPublish: undefined,
        associatedRoute: rule.route,
      });
    });
  };

  useEffect(() => {
    if (!initialized.current) {
      initializeEditableFields().then(() => {
        console.log('[TEST] Champs init =>', fieldStore.getAllFields?.());
        console.log('[TEST] VV BLOCS init =>', blocStore.getAllBlocGroups?.());
        console.log(
          '[TEST] BLOCPICKERS =>',
          blocPickerStore.getAllBlocPickers(),
        );
        initialized.current = true;
      });
    }
  }, []);

  // Met à jour la valeur d'un champ editable, Texte, Image ou autre
  const setEditableValue = (
    key: string,
    value: EditableValue,
    specificRules: BaseRule,
    isValid: boolean = true,
  ) => {
    const field = fieldStore.getField(key);
    if (!field) return;

    console.log(
      `SETeDITABLEvALUE => Setting value for ${key}:`,
      value,
      'isValid:',
      isValid,
    );

    // Cas image : redirige vers la fonction dédiée
    if (field.dataType === DynamicDataType.Image) {
      const image = value as ImageEntry;

      // Dans le cas où on rollback la FAVICON, il faut aussi supprimer les icônes générées des champs
      if (image.file === undefined && key.toUpperCase().includes('FAVICON')) {
        const iconKeys = fieldStore.getKeysMatching((k) =>
          k.startsWith('icon_'),
        );
        fieldStore.deleteFields(iconKeys);
      }

      // On prévoit un fallback si l'image n'est pas définie. On pourra ainsi utiliser cette fonction pour reset l'image à son état initial
      const fallback = {
        file: undefined,
        previewUrl: (field.initial as ImageEntry).previewUrl,
        remoteUrl: (field.initial as ImageEntry).remoteUrl,
      };

      const sanitizedImage = image ?? fallback;

      /** Si c'est en erreur on ne modifie pas le toPublish */
      fieldStore.setField(key, {
        ...field,
        current: { ...field.current, value: sanitizedImage },
        inError: !isValid,
        toPublish: isValid
          ? { ...field.toPublish, value: sanitizedImage }
          : field.toPublish,
      });
    } else if (field.dataType === DynamicDataType.Text) {
      const rules = specificRules as TextRule;
      const text = value as string;
      const isTextarea = rules.lineBreakable;

      const sanitizedValue =
        rules.textType === 'email'
          ? sanitizeEmail(text)
          : sanitizeText(text, isTextarea);

      fieldStore.setField(key, {
        ...field,
        current: { ...field.current, value: text },
        inError: !isValid,
        toPublish: isValid
          ? { ...field.toPublish, value: sanitizedValue }
          : field.toPublish,
      });
    } else if (field.dataType === DynamicDataType.Video) {
      const video = value as VideoEntry;

      // Fallback si rien n'est défini (rollback)
      const fallback = {
        file: undefined,
        previewUrl: (field.initial as VideoEntry).previewUrl,
        remoteUrl: (field.initial as VideoEntry).remoteUrl,
      };

      const sanitizedVideo = video ?? fallback;

      fieldStore.setField(key, {
        ...field,
        current: { ...field.current, value: sanitizedVideo },
        inError: !isValid,
        toPublish: isValid
          ? { ...field.toPublish, value: sanitizedVideo }
          : field.toPublish,
      });
    }
  };

  const addBlocInstance = (
    blocKey: string,
    index: number,
    fieldKeys: string[],
    order: number,
  ) => {
    console.log(
      'NEW BLOC INSTANCE INCOMING :',
      blocKey,
      index,
      order,
      fieldKeys,
    );
    const blocInstance = createInstanceForBlocGroup(
      blocKey,
      index,
      index,
      fieldKeys,
      order,
      {
        isNew: true,
      },
    );
    blocStore.setInstanceToGroup(blocKey, blocInstance);
    console.log('UPDATED BLOC INSTANCES CHECK:', blocStore.getAllBlocGroups());
  };

  /** Fonction pour mettre à jour l'ORDER pour des FIELDS donnés */
  const updateFieldsOrder = (orderedFields: FieldKeyWithOrder[]) => {
    const blocUpdates = new Map<
      string,
      { blocIndex: number; updates: { fieldFullKey: string; order: number }[] }
    >();

    orderedFields.forEach(({ key, blocKey, index: blocIndex, order }) => {
      if (!blocKey) return;
      fieldStore.updateField(key, (prev) => ({
        ...prev,
        current: { ...prev.current, order },
        toPublish: { ...prev.toPublish, order },
      }));

      const blocUpdate = blocUpdates.get(blocKey) || { blocIndex, updates: [] };
      blocUpdate.updates.push({ fieldFullKey: key, order });
      blocUpdates.set(blocKey, blocUpdate);
    });

    blocUpdates.forEach(({ blocIndex, updates }, blocKey) => {
      blocStore.updateFieldOrdersForBlocInstance(blocKey, blocIndex, updates);
    });
  };

  /** Fonction générique pour choper une page dédiée */
  const getStaticSnapshotByPrefix = (
    groups: readonly { prefix: string; label: string }[],
  ): EditableGroup[] => {
    return groups
      .map(({ prefix, label }) => {
        const keys = fieldStore.getKeysMatching((key) =>
          key.startsWith(prefix),
        );

        const fields: EditableFields = {};

        for (const key of keys) {
          const field = fieldStore.getField(key);
          if (!field || field.partOfBloc) continue;
          fields[key] = field;
        }

        return {
          kind: 'fields',
          label,
          fields,
        } as const;
      })
      .filter(({ fields }) => Object.keys(fields).length > 0);
  };

  /** Fourni les datas pour la page Paramètres Globaux */
  const getGlobalsSnapshot = () =>
    getStaticSnapshotByPrefix([
      { prefix: 'META_SEO_', label: 'Métadonnées Principales' },
      { prefix: 'META_OG_', label: 'Métadonnées Réseaux Sociaux' },
    ]);

  /** Fournit les datas pour la page Contact + Réseaux sociaux */
  const getContactSnapshot = () =>
    getStaticSnapshotByPrefix([
      { prefix: 'CONTACT_', label: 'Informations de contact' },
      { prefix: 'SOCIALS_', label: 'Vos réseaux sociaux' },
    ]);

  /** Fourni les datas pour une page donnée */
  const getPageSnapshot = (route: string): EditableGroup[] => {
    const groups: EditableGroup[] = [];
    const textFields: EditableFields = {};
    const imageFields: EditableFields = {};
    const videoFields: EditableFields = {};
    const blocFieldGroups: Record<
      string,
      Extract<EditableGroup, { kind: 'fields' }>
    > = {};

    const fieldsForRoute = fieldStore.getFieldsForRoute(route);

    for (const [key, field] of Object.entries(fieldsForRoute)) {
      if (!field) continue;

      if (field.partOfBloc === false) {
        if (key in textRules && isValidTextField(field)) {
          textFields[key] = field;
        } else if (key in imageRules && isValidImageField(field)) {
          imageFields[key] = field;
        } else if (key in videoRules && isValidVideoField(field)) {
          videoFields[key] = field;
        }
      } else {
        const mainKey = field.blocKey;
        if (!mainKey) continue;
        const blocGroup = blocStore.getBlocGroup(mainKey);
        const blocLabel = blocGroup?.rule.blocTitle || 'Bloc sans titre';

        if (!blocFieldGroups[mainKey]) {
          blocFieldGroups[mainKey] = {
            kind: 'fields',
            label: blocLabel,
            fields: {},
            blocKey: mainKey,
          };
        }

        const index = parseBlocFullKey(key)!.index;
        if (
          !blocGroup.blocInstances[index] ||
          blocGroup.blocInstances[index].isDeleted
        )
          continue;
        blocFieldGroups[mainKey].fields[key] = field as EditableField;
      }
    }

    const allPickers = blocPickerStore.getAllBlocPickers();
    const pickersForRoute = Object.values(allPickers).filter(
      (p) => p.rule.route === route,
    );

    if (pickersForRoute.length) {
      groups.push({
        kind: 'blocPickers',
        label: pickersForRoute[0].rule.title,
        fields: pickersForRoute,
      });
    }
    if (Object.keys(textFields).length) {
      groups.push({
        kind: 'fields',
        label: 'Champs texte',
        fields: textFields,
      });
    }
    if (Object.keys(imageFields).length) {
      groups.push({ kind: 'fields', label: 'Images', fields: imageFields });
    }
    if (Object.keys(imageFields).length) {
      groups.push({ kind: 'fields', label: 'Vidéos', fields: videoFields });
    }
    for (const group of Object.values(blocFieldGroups)) {
      groups.push(group);
    }

    groups.sort((a, b) => {
      const getRank = (g: EditableGroup): number => {
        if (g.kind === 'blocPickers')
          return g.fields[0]?.rule?.rank ?? Infinity;
        if (g.kind === 'fields' && g.blocKey)
          return blocStore.getBlocGroup(g.blocKey)?.rule?.rank ?? Infinity;
        return Infinity;
      };
      return getRank(a) - getRank(b);
    });

    return groups;
  };

  /** Récupère les clés modifiées pour les afficher dans la barre d'outils
   * Elle sert aussi à détecter les changements
   */
  const getModifiedFields = () => {
    // console.trace('getModifiedFields called from:');

    const modifiedTextFields: ModifiedFieldVM[] = [];
    const modifiedImageFields: ModifiedFieldVM[] = [];
    const modifiedBlocs: ModifiedBlocVM[] = [];

    const { modifiedFields, deletedFields, createdFields } =
      fieldStore.getCleanModifiedFields();
    const { deletedBlocs, createdBlocs, modifiedBlocInstances } =
      blocStore.getModifiedBlocs();
    const modifiedBlocPickers = blocPickerStore.getModifiedBlocPickers();

    // 1. Traiter les blocs créés
    console.log('MES FIELDS NEW : ', createdFields);
    console.log('MES FIELDS SUPR : ', deletedFields);
    console.log('MES FIELDS MODIFIED : ', modifiedFields);
    console.log('MES BLOCS CREES : ', modifiedBlocs);
    console.log('MES BLOCS DELETED : ', deletedBlocs);
    console.log('MES BLOCS MODIFIED : ', modifiedBlocInstances);
    console.log('MES BLOCS PICKER MODIFIED : ', modifiedBlocPickers);
    for (const [index, blocInstance] of Object.entries(createdBlocs)) {
      const blocKey = blocInstance.blocKey;
      modifiedBlocs.push({
        blocKey,
        blocTitle: blocRules[blocKey].itemLabel,
        index: blocInstance.index,
        originalJsonIndex: blocInstance.originalJsonIndex,
        isNew: true,
        isDeleted: false,
        isReordered: false,
        order: blocInstance.toPublish?.order || blocInstance.initial.order || 0,
      });
    }

    // 2. Traiter les blocs supprimés
    for (const [index, blocInstance] of Object.entries(deletedBlocs)) {
      const blocKey = blocInstance.blocKey;
      // On alimente les fields pour pouvoir les traiter a la publi

      modifiedBlocs.push({
        blocKey,
        blocTitle: blocRules[blocKey].itemLabel,
        index: blocInstance.index,
        originalJsonIndex: blocInstance.originalJsonIndex,
        isNew: false,
        isDeleted: true,
        isReordered: false,
        order: blocInstance.toPublish?.order || blocInstance.initial.order || 0,
        deletedFields: blocInstance.fieldKeys,
      });
    }

    // 3. Traiter les BLOCs modifiés (reordered)
    for (const [instanceKey, blocInstance] of Object.entries(
      modifiedBlocInstances,
    )) {
      if (blocInstance.inError) continue;
      const isReordered =
        !!blocInstance.toPublish &&
        !blocInstance.inError &&
        blocInstance.initial.order !== blocInstance.toPublish.order;

      modifiedBlocs.push({
        blocKey: blocInstance.blocKey,
        blocTitle: blocRules[blocInstance.blocKey].itemLabel,
        index: blocInstance.index,
        originalJsonIndex: blocInstance.originalJsonIndex,
        modifiedFields: {},
        isNew: false,
        isDeleted: false,
        isReordered,
        order: blocInstance.toPublish?.order || blocInstance.initial.order || 0,
      });
    }

    // 4. Traiter les champs modifiés (modified fields)
    for (const key in modifiedFields) {
      const field = modifiedFields[key];
      const fieldVM: ModifiedFieldVM = {
        key,
        value: field.toPublish?.value ?? field.current.value,
        dataType: field.dataType,
        label: field.label,
        partOfBloc: field.partOfBloc,
      };

      if (
        field.toPublish?.order != undefined &&
        field.toPublish?.order !== field.initial?.order
      )
        fieldVM.reordered = true;

      if (field.partOfBloc && field.blocKey) {
        const blocGroup = blocStore.getBlocGroup(field.blocKey);
        const parsedKey = parseBlocFullKey(key);
        const index = parsedKey!.index;

        // Si le bloc est en erreur on ignore le champ
        if (
          !blocGroup.blocInstances[index] ||
          blocGroup.blocInstances[index].inError === true
        )
          continue;

        const newOrder =
          field.toPublish && field.toPublish?.order
            ? field.toPublish.order
            : field.initial.order;
        fieldVM.blocKey = field.blocKey;
        fieldVM.index = index;
        fieldVM.order = newOrder;
        fieldVM.fieldIndex = field.fieldIndex;

        const existingBloc = modifiedBlocs.find(
          (b) => b.blocKey === field.blocKey && b.index === index,
        );

        if (existingBloc) {
          // Le bloc existe, ajouter le champ à ses modifiedFields
          existingBloc.modifiedFields = existingBloc.modifiedFields || {};
          existingBloc.modifiedFields[key] = fieldVM;
        } else {
          const blocInstance = blocGroup.blocInstances[index];
          if (!blocInstance) continue;
          const isReordered =
            (blocInstance.toPublish &&
              blocInstance.toPublish?.order !== blocInstance.initial.order) ||
            false;

          // Le bloc n'existe pas, le créer
          modifiedBlocs.push({
            blocKey: blocInstance.blocKey,
            blocTitle: blocRules[field.blocKey].itemLabel,
            index: blocInstance.index,
            originalJsonIndex: blocInstance.originalJsonIndex,
            modifiedFields: {
              [key]: fieldVM,
            },
            isNew: blocInstance.isNew || false,
            isDeleted: blocInstance.isDeleted || false,
            isReordered: isReordered,
            order:
              blocInstance.toPublish?.order || blocInstance.initial.order || 0,
          });
        }
      } else {
        if (field.dataType === DynamicDataType.Text) {
          modifiedTextFields.push(fieldVM);
        } else if (
          field.dataType === DynamicDataType.Image ||
          field.dataType === DynamicDataType.Video
        ) {
          modifiedImageFields.push(fieldVM);
        }
      }
    }

    /** 5. Traitement des champs supprimés */
    for (const key in deletedFields) {
      const field = deletedFields[key];
      const fieldVM: ModifiedFieldVM = {
        key,
        value: field.toPublish?.value ?? field.current.value,
        dataType: field.dataType,
        label: field.label,
        partOfBloc: field.partOfBloc,
        isDeleted: true,
      };

      if (field.partOfBloc && field.blocKey) {
        const blocGroup = blocStore.getBlocGroup(field.blocKey);
        const parsedKey = parseBlocFullKey(key);
        const index = parsedKey!.index;

        if (
          !blocGroup.blocInstances[index] ||
          blocGroup.blocInstances[index].inError
        ) {
          continue;
        }

        fieldVM.blocKey = field.blocKey;
        fieldVM.index = index;
        fieldVM.order = field.initial.order;
        fieldVM.fieldIndex = field.fieldIndex;

        const existingBloc = modifiedBlocs.find(
          (b) => b.blocKey === field.blocKey && b.index === index,
        );

        if (existingBloc) {
          existingBloc.modifiedFields = existingBloc.modifiedFields || {};
          existingBloc.modifiedFields[key] = fieldVM;
        } else {
          modifiedBlocs.push({
            blocKey: field.blocKey,
            blocTitle: blocRules[field.blocKey].itemLabel,
            index,
            originalJsonIndex: index,
            modifiedFields: { [key]: fieldVM },
            isNew: false,
            isDeleted: false, // ⚠️ le bloc n’est pas supprimé, juste un champ dedans
            isReordered: false,
            order:
              blocGroup.blocInstances[index].toPublish?.order ||
              blocGroup.blocInstances[index].initial.order ||
              0,
          });
        }
      } else {
        if (field.dataType === DynamicDataType.Text) {
          modifiedTextFields.push(fieldVM);
        } else if (
          field.dataType === DynamicDataType.Image ||
          field.dataType === DynamicDataType.Video
        ) {
          modifiedImageFields.push(fieldVM);
        }
      }
    }

    /** 6. Traitement des champs Crées
     * Je les ajoutes au blocsVM s'ils en font partie
     */
    for (const key in createdFields) {
      const field = createdFields[key];
      const fieldVM: ModifiedFieldVM = {
        key,
        value: field.toPublish?.value ?? field.current.value,
        dataType: field.dataType,
        label: field.label,
        partOfBloc: field.partOfBloc,
        isNew: true,
      };

      if (field.partOfBloc && field.blocKey) {
        // On ajoute au modifiedBlocVM pour plus de clarté
        const parsedKey = parseBlocFullKey(key);
        const index = parsedKey!.index;
        const blocGroup = blocStore.getBlocGroup(field.blocKey);

        // En cas de bloc invalide, on fait rien
        if (
          !blocGroup.blocInstances[index] ||
          blocGroup.blocInstances[index].inError
        ) {
          continue;
        }

        const newOrder = field.toPublish?.order ?? field.initial.order;

        fieldVM.blocKey = field.blocKey;
        fieldVM.index = index;
        fieldVM.order = newOrder;
        fieldVM.fieldIndex = field.fieldIndex;

        const existingBloc = modifiedBlocs.find(
          (b) => b.blocKey === field.blocKey && b.index === index,
        );
        if (existingBloc) {
          existingBloc.modifiedFields = existingBloc.modifiedFields || {};
          existingBloc.modifiedFields[key] = fieldVM;
        } else {
          modifiedBlocs.push({
            blocKey: field.blocKey,
            blocTitle: blocRules[field.blocKey].itemLabel,
            index,
            originalJsonIndex: index,
            modifiedFields: { [key]: fieldVM },
            isNew: false,
            isDeleted: false,
            isReordered: false,
            order:
              blocGroup.blocInstances[index].toPublish?.order ||
              blocGroup.blocInstances[index].initial.order ||
              0,
          });
        }
      } else {
        if (field.dataType === DynamicDataType.Text) {
          modifiedTextFields.push(fieldVM);
        } else if (
          field.dataType === DynamicDataType.Image ||
          field.dataType === DynamicDataType.Video
        ) {
          modifiedImageFields.push(fieldVM);
        }
      }
    }

    return {
      modifiedTextFields,
      modifiedImageFields,
      modifiedBlocs,
      deletedFields,
      modifiedBlocPickers,
    };
  };

  /** Hook pour récupérer les clés modifiées */
  const useModifiedFields = () => {
    const [version, setVersion] = useState(0);

    useEffect(() => {
      let blocChangeInProgress = false;
      let pickerChangeInProgress = false;

      const increment = () => setVersion((v) => v + 1);

      const onBlocChange = () => {
        console.log('BLOC CHANGED FROM useModifields');
        blocChangeInProgress = true;
        increment();

        setTimeout(() => {
          blocChangeInProgress = false;
        }, 100);
      };

      const onPickerChange = () => {
        console.log('OICKER CHANGED FROM useModifields');
        pickerChangeInProgress = true;
        increment();

        setTimeout(() => {
          pickerChangeInProgress = false;
        }, 100);
      };

      const onFieldChange = () => {
        if (!blocChangeInProgress && !pickerChangeInProgress) {
          console.log('FIUELD CHANGED FROM useModifields');

          increment();
        }
      };

      const unsubscribeFields = fieldStore.subscribeAllFields(onFieldChange);
      const unsubscribeBlocs = blocStore.subscribeBlocAll(onBlocChange);
      const unsubscribePickers =
        blocPickerStore.subscribeAllBlocPickers(onPickerChange);

      return () => {
        unsubscribeFields();
        unsubscribeBlocs();
        unsubscribePickers();
      };
    }, []);

    return React.useMemo(() => getModifiedFields(), [version]);
  };

  /** Hook pour savoir s'il y a des changements non publiés */
  const useHasChanges = (): boolean => {
    const {
      modifiedTextFields,
      modifiedImageFields,
      modifiedBlocs,
      modifiedBlocPickers,
    } = useModifiedFields();

    return (
      modifiedTextFields.length > 0 ||
      modifiedImageFields.length > 0 ||
      modifiedBlocPickers.length > 0 ||
      modifiedBlocs.length > 0
    );
  };

  /** Hook pour savoir si un bloc est en erreur (= un de ses fields inError) */
  const useBlocInstanceError = (blocKey: string, index: number): boolean => {
    const [hasError, setHasError] = useState(false);
    useEffect(() => {
      const keys = fieldStore.getKeysMatching((key) => {
        const parsed = parseBlocFullKey(key);
        return (
          parsed !== null &&
          parsed.blocKey === blocKey &&
          parsed.index === index
        );
      });

      const checkErrors = () => {
        const anyInError = keys.some(
          (key) => fieldStore.getField(key)?.inError,
        );
        setHasError(anyInError);
        blocStore.updateBlocError(blocKey, index, anyInError);
      };

      const unsubscribe = fieldStore.subscribeFields(keys, checkErrors);
      checkErrors();

      return unsubscribe;
    }, [blocKey, index]);

    return hasError;
  };

  const useAllCleanDuplicableFieldInstances = (
    fieldKeys: string[],
  ): number[] => {
    const [counts, setCounts] = useState<number[]>([]);

    useEffect(() => {
      // On récupère le nombre d'instances pour chaque clé
      const initialCounts = fieldKeys.map(
        (key) => fieldStore.getCleanDuplicableFieldInstances(key).length,
      );
      setCounts(initialCounts);

      // On s'abonne aux mises à jour pour chaque clé
      const unsubscribes = fieldKeys.map((key) =>
        fieldStore.subscribeFields(key, () => {
          const updatedCounts = fieldKeys.map(
            (k) => fieldStore.getCleanDuplicableFieldInstances(k).length,
          );
          setCounts(updatedCounts);
        }),
      );

      // Nettoyage des abonnements
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [fieldKeys]);

    return counts;
  };

  /** Restaure les valeurs initiales de tous les champs */
  const rollbackToInitial = () => {
    const fieldsToRollback = fieldStore.getFieldsToRollback();
    console.log('[TEST] ROLLBACK TO INITIAL : ', fieldsToRollback);

    ReactDOM.unstable_batchedUpdates(() => {
      const blocs = blocStore.getAllBlocGroups();
      const fieldsToDelete: string[] = [];
      const blocUpdates = new Map<string, BlocInstanceState>();

      // 1. Rollback des blocs
      Object.values(blocs).forEach((group) => {
        Object.values(group.blocInstances).forEach((instance) => {
          if (instance.isNew) {
            blocStore.deleteInstanceFromGroup(instance.blocKey, instance.index);
            return;
          }

          const updated = {
            ...instance,
            isDeleted: false,
            current: instance.toPublish
              ? { ...instance.initial }
              : instance.current,
            toPublish: undefined,
          };

          blocUpdates.set(`${instance.blocKey}-${instance.index}`, updated);
          blocStore.setInstanceToGroup(instance.blocKey, updated);
        });
      });

      // 2. Rollback des champs
      Object.entries(fieldsToRollback).forEach(([key, field]) => {
        if (!field) return;

        // Champs simples nouveaux
        if (field.isNew && !field.partOfBloc) {
          fieldsToDelete.push(key);
          return;
        }

        // Champs de blocs
        if (
          field.partOfBloc &&
          (field.isNew ||
            field.isDeleted ||
            field.toPublish?.order !== field.initial?.order)
        ) {
          const parsedKey = parseBlocFullKey(key);
          if (!parsedKey) return;

          const { blocKey, index } = parsedKey;
          const cacheKey = `${blocKey}-${index}`;
          const instance =
            blocUpdates.get(cacheKey) ||
            blocStore.getBlocInstance(blocKey, index);
          if (!instance) return;

          if (field.isNew) {
            blocStore.deleteFieldKeyFromInstance(blocKey, index, key);
            fieldsToDelete.push(key);
            return;
          }

          if (field.isDeleted) {
            blocStore.addFieldKeyToBlocInstance(
              blocKey,
              index,
              key,
              field.initial?.order,
            );
          }

          if (
            field.toPublish?.order !== field.initial?.order &&
            instance.fieldOrders &&
            field.initial?.order
          ) {
            instance.fieldOrders[key] = field.initial.order;
            blocStore.setInstanceToGroup(blocKey, instance);
          }
        }

        // Mise à jour du champ
        fieldStore.updateField(key, (prev) => ({
          ...prev,
          current: prev.initial,
          toPublish: undefined,
          isDeleted: false,
        }));
      });

      // 3. Suppression des champs
      fieldsToDelete.forEach((key) => fieldStore.deleteFields(key));
    });

    // 4. Rollback des BlocPickers
    const allPickers = blocPickerStore.getAllBlocPickers();
    Object.entries(allPickers).forEach(([key, picker]) => {
      console.log(`ROLLBACK DE MON BLOC PICKER : ${key}`);
      console.log(picker);

      blocPickerStore.updateBlocPicker(key, (prev) => ({
        ...prev,
        current: prev.initial,
        toPublish: undefined,
      }));
    });

    setRollbackCount((prev) => prev + 1);
  };

  /** Une vois la publication validée met à jour les champs sans avoir à recharger la page */
  const updateDataAfterPublish = () => {
    const fields = fieldStore.getAllFields();
    const blocGroups = blocStore.getAllBlocGroups();
    const blocPickers = blocPickerStore.getAllBlocPickers();

    Object.entries(fields).forEach(([key, field]) => {
      if (field.isDeleted) {
        fieldStore.deleteFields(key);
        return;
      }

      const newInitial = field.toPublish
        ? { ...field.current, ...field.toPublish }
        : (field.current ?? field.initial);

      fieldStore.updateField(key, (prev) => ({
        ...prev,
        initial: newInitial,
        current: newInitial,
        toPublish: undefined,
        isNew: false,
        isDeleted: false,
      }));
    });

    Object.values(blocGroups).forEach((blocGroup) => {
      Object.entries(blocGroup.blocInstances).forEach(([key, bloc]) => {
        if (bloc.isDeleted) {
          blocStore.deleteBlocInstance(bloc.blocKey, bloc.index);
          return;
        }

        if (bloc.toPublish) {
          const newInitial = { ...bloc.current, ...bloc.toPublish };

          blocStore.updateBlocInstance(bloc.blocKey, bloc.index, (prev) => ({
            ...prev,
            initial: newInitial,
            current: newInitial,
            toPublish: undefined,
            isNew: false,
            isDeleted: false,
          }));
        }
      });
    });

    // Mise à jour des BlocPickers
    Object.entries(blocPickers).forEach(([pickerKey, picker]) => {
      blocPickerStore.updateBlocPicker(pickerKey, (prev) => ({
        ...prev,
        initial: prev.current,
        toPublish: undefined,
      }));
    });
  };

  /** Permet de créer un nouveau champs editable - Utile pour les nouveaux blocs
  /* ou pour les icônes qu'on vient de générer' */
  const createNewField = (
    key: string,
    fieldOptions: EditableFieldOptions,
    value?: EditableValue,
    order?: number,
  ) => {
    const getDefaultValue = (dataType: DynamicDataType): EditableValue => {
      switch (dataType) {
        case DynamicDataType.Text:
          return '';
        case DynamicDataType.Image:
          return { file: undefined, previewUrl: '', remoteUrl: '' };
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
    };

    const newField = makeEditableField(
      key,
      value || getDefaultValue(fieldOptions.dataType),
      fieldOptions,
      order,
    );

    console.log('NEW FIELD CREATED : ', newField);
    fieldStore.setField(key, newField);
  };

  const deleteBloc = (blocKey: string, index: number, itemKeys: string[]) => {
    const blocInstance = blocStore.getBlocGroup(blocKey)!.blocInstances[index];
    if (!blocInstance) return;

    if (blocInstance.isNew) {
      blocStore.deleteInstanceFromGroup(blocKey, index);
    } else {
      blocStore.markInstanceAsDeleted(blocKey, index);
    }

    itemKeys.forEach((itemKey) => {
      const fullKey = `${blocKey}.${itemKey}.${index}`;
      const field = fieldStore.getField(fullKey);
      if (!field) return;

      // Si le champ est nouveau, on le supprime vraiment
      if (field.isNew) {
        fieldStore.deleteFields(fullKey);
        return;
      }

      // Sinon on le marque comme supprimé
      fieldStore.updateField(fullKey, (prev) => ({
        ...prev,
        isDeleted: true,
      }));
    });
  };

  const addDuplicableField = async (
    targetKey: string,
    blocKey: string,
    blocIndex: number,
    fieldKey: string,
    order: number,
  ): Promise<string | null> => {
    // 1. Récupère tous les keys du fieldStore liés à ce bloc/field
    const allKeys = fieldStore.getKeysMatching((key) => {
      const parsed = parseBlocFullKey(key);
      return !!(
        parsed &&
        parsed.blocKey === blocKey &&
        parsed.fieldKey === fieldKey &&
        parsed.index === blocIndex
      );
    });

    // 2. Cherche le max fieldIndex existant
    let maxIndex = -1;
    for (const key of allKeys) {
      const parsed = parseBlocFullKey(key)!;
      if (parsed.fieldIndex !== undefined) {
        maxIndex = Math.max(maxIndex, parsed.fieldIndex);
      }
    }

    const newIndex = maxIndex + 1;

    const newFieldKey = makeFullKeyForBlocItem(
      blocKey,
      fieldKey,
      blocIndex,
      newIndex,
    );

    const targetField = fieldStore.getField(targetKey);
    if (!targetField) return null;

    blocStore.addFieldKeyToBlocInstance(blocKey, blocIndex, newFieldKey, order);

    const newFieldOptions: EditableFieldOptions = {
      dataType: targetField.dataType,
      label: targetField.label,
      partOfBloc: true,
      isNew: true,
      blocKey,
      associatedRoute: targetField.associatedRoute,
      inError: targetField.dataType === DynamicDataType.Image ? false : true,
      fieldIndex: newIndex,
    };

    createNewField(newFieldKey, newFieldOptions, undefined, order);
    return newFieldKey;
  };

  const deleteFields = (key: string) => {
    const field = fieldStore.getField(key);

    if (field.isNew) {
      fieldStore.deleteFields(key);
    } else {
      fieldStore.updateField(key, (prev) => ({ ...prev, isDeleted: true }));
    }

    // Parse la key pour savoir dans quel bloc et index il est
    const parsed = parseBlocFullKey(key);
    if (!parsed) return;
    const { blocKey, index, fieldKey } = parsed;

    // Récupère l'instance du bloc
    const blocInstance = blocStore.getBlocGroup(blocKey)?.blocInstances[index];
    if (!blocInstance) return;

    blocStore.deleteFieldKeyFromInstance(blocKey, index, key);
  };

  const useFieldStore = (fieldKey: string) => {
    const field = useSyncExternalStore(
      (cb) => fieldStore.subscribeFields(fieldKey, cb),
      () => fieldStore.getField(fieldKey),
      () => fieldStore.getField(fieldKey),
    );

    const currentValue = field?.current.value;
    const initialValue = field?.initial.value;

    return {
      field,
      currentValue,
      initialValue,
    };
  };

  // Avant le return du Provider, ajouter :

  const setBlocPickerValue = (pickerKey: string, value: BlocPickerValue) => {
    console.log(`UPDATING BLOC PICKER : ${pickerKey} with value`);
    console.log(value);

    blocPickerStore.updateBlocPicker(pickerKey, (prev) => ({
      ...prev,
      current: value,
      toPublish: value,
    }));
  };

  const useBlocPickerStore = (pickerKey: string) => {
    const picker = useSyncExternalStore(
      (cb) => blocPickerStore.subscribeBlocPicker(pickerKey, cb),
      () => blocPickerStore.getBlocPicker(pickerKey),
      () => blocPickerStore.getBlocPicker(pickerKey),
    );

    if (!picker) {
      throw new Error(`BlocPicker ${pickerKey} not found`);
    }

    return {
      picker,
      currentValue: picker.current,
      initialValue: picker.initial,
    };
  };

  // Met à jour le contenu JSON stocké en front (après une publication réussie)
  function updateJsonContent(newContent: string) {
    setJsonContent(newContent);
  }

  return (
    <AdminDataContext.Provider
      value={{
        fields: {
          getField: fieldStore.getField,
          setEditableValue,
          createNewField,
          subscribeFields: fieldStore.subscribeFields,
          useFieldStore,
          deleteFields,
          addDuplicableField,
          updateFieldsOrder,
          getFieldTitleForBlocs: fieldStore.getTitleFieldsForBlocKeys,
        },
        snapshots: {
          getGlobalsSnapshot,
          getContactSnapshot,
          getPageSnapshot,
          rollbackCount,
        },
        publish: {
          updateDataAfterPublish,
          getModifiedFields,
        },
        rollback: {
          rollbackToInitial,
        },
        uiHooks: {
          useHasChanges,
          useBlocInstanceError,
          useModifiedFields,
          useAllCleanDuplicableFieldInstances,
        },
        raw: {
          jsonContent,
          updateJsonContent,
        },
        blocs: {
          getBlocGroup: blocStore.getBlocGroup,
          deleteBloc,
          addBlocInstance,
          subscribeBlocs: blocStore.subscribeBlocs,
          updateBlocOrders: blocStore.updateBlocOrders,
        },
        blocPickers: {
          getBlocPicker: blocPickerStore.getBlocPicker,
          setBlocPickerValue,
          subscribeBlocPicker: blocPickerStore.subscribeBlocPicker,
          useBlocPickerStore,
        },
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => useContext(AdminDataContext);
