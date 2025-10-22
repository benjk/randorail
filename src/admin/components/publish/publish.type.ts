import { BlocPickerRule } from '../../data/blocPickerRules';
import { imageRules } from '../../data/imageRules';
import { BlocRuleOptions } from '../blocs/blocRulesFactory';

//*********************************
// *********DATAS TYPES*********
// *********************************

export interface ImageEntry {
  file?: File;
  previewUrl?: string;
  remoteUrl?: string;
}

export interface VideoEntry {
  file?: File;
  previewUrl?: string;
  remoteUrl?: string;
}

/** Le type de value principale */
export type EditableValue = string | ImageEntry | boolean | VideoEntry;

export enum DynamicDataType {
  Text = 'text',
  Image = 'image',
  Boolean = 'booleen',
  Video = 'video',
}

/** Interface utilisée pour les iotems duplicables: Fields ou Blocs */
export interface DuplicableItem {
  isNew?: boolean;
  isDeleted?: boolean;
}

/** Props Dynamique d'un Item OU d'un Bloc */
export interface MutableProps {
  order?: number;
}

/** Petite fonction d'extraction à màj en meme temps que le type @MutableProps */
export function extractMutableProps(bloc: ModifiedBlocVM): MutableProps {
  return {
    order: bloc.order,
  };
}

export interface LifecycleFlags extends DuplicableItem {
  inError?: boolean;
}

/** Les props de config fixes ne sont pas editable */
export interface EditableFieldOptions extends LifecycleFlags {
  dataType: DynamicDataType;
  partOfBloc?: boolean;
  blocKey?: string;
  label?: string;
  isGenerated?: boolean;
  associatedRoute?: string;
  fieldIndex?: number;
}

/** Un champ avec toutes ces props */
export interface EditableField extends EditableFieldOptions {
  initial: MutableProps & { value: EditableValue };
  current: MutableProps & { value: EditableValue };
  toPublish?: Partial<MutableProps & { value: EditableValue }>;
}

export type EditableFields = Record<string, EditableField>;

/** Fonction renvoyé pour les snapShots */
export type EditableGroup =
  | {
      kind: 'fields';
      label: string;
      fields: EditableFields;
      blocKey?: string;
    }
  | {
      kind: 'blocPickers';
      label: string;
      fields: BlocPickerState[];
    };

export type FieldKeyWithOrder = {
  key: string;
  order: number;
  blocKey?: string;
  index: number;
  fieldIndex?: number;
};

export interface ModifiedFieldVM extends MutableProps, DuplicableItem {
  key: string;
  value: EditableValue;
  dataType: DynamicDataType;
  label?: string; // utile pour affichage
  partOfBloc?: boolean;
  blocKey?: string;
  index?: number; // si field dans un bloc répété
  originalJsonIndex?: number; // Idem
  order?: number;
  fieldIndex?: number;
  reordered?: boolean; // prop bonus pr simplifier l'affichage toolbar
}

export type GroupedField = {
  blocKey: string;
  blocIndex: number;
  fieldKey: string;
  fields: { key: string; order: number }[];
};

export type LocalFields = {
  singles: string[];
  groups: Record<string, GroupedField>;
};

//*********************************
/********* BLOCS SYSTEMS **********/
//*********************************

export type BlocGroups = Record<string, BlocGroupInfo>;

export interface BlocGroupInfo {
  blocKey: string;
  rule: BlocRuleOptions;
  blocInstances: Record<string, BlocInstanceState>;
}

export interface BlocInstanceState extends LifecycleFlags {
  blocKey: string;
  index: number;
  originalJsonIndex: number;
  fieldKeys: string[];
  fieldOrders?: Record<string, number>; // Ajout des orders en option pour l'affichage
  initial: MutableProps;
  current: MutableProps;
  toPublish?: Partial<MutableProps>;
}

/** Type utilisé pour faciliter la manipulation des keys de bloc */
export type ParsedBlocKey = {
  blocKey: string;
  fieldKey: string;
  index: number;
  fullKey: string;
  fieldIndex?: number;
} | null;

/** Type utilisé pour définir le format des infos qui viennent du content.json */
export type BlocItemValues = {
  order: number;
  [key: string]: any;
};

export type EnrichedBlocItem = BlocItemValues & {
  originalJsonIndex: number;
};

// ViewModel utilisé pour afficher les modifications liés à un bloc
export interface ModifiedBlocVM extends MutableProps {
  blocKey: string;
  blocTitle: string;
  index: number;
  originalJsonIndex: number;
  modifiedFields?: Record<string, ModifiedFieldVM>;
  deletedFields?: string[];
  isNew: boolean;
  isDeleted: boolean;
  isReordered: boolean;
}

//*********************************
// *********BLOC PICKERS*********
// *********************************
export interface BlocPickerValue {
  enabled: boolean;
  sourceBlocKey: string;
  blocIndex: number;
}

export interface BlocPickerState {
  pickerKey: string;
  rule: BlocPickerRule;
  initial: BlocPickerValue;
  current: BlocPickerValue;
  toPublish?: BlocPickerValue;
  associatedRoute?: string;
}

//*********************************
// *********SERVER MESSAGES*********
// *********************************

export interface ServerMessage {
  type: ServerMessageType;
  text: string;
}

export enum ServerMessageType {
  Success = 'success',
  Info = 'info',
  Error = 'error',
}

export class PublishError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PublishError';
    this.status = status;

    Object.setPrototypeOf(this, PublishError.prototype);
  }
}

//*********************************
// *********DEPLOYMENT*********
// *********************************

export enum DeploymentState {
  Idle = 'idle',
  Pending = 'pending',
  Deployed = 'deployed',
  Error = 'error',
}
