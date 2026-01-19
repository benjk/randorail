export interface EditablePageMeta {
  key: string;
  title: string;
  parent?: string;
}

export interface AdminMenuNode {
  key: string;
  label: string;
  children?: AdminMenuNode[];
}

export interface PageMetaEntry {
  label: string;
  editable?: boolean;
  parent?: string;
}