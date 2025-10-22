import { DynamicDataType, EditableField, EditableValue, ImageEntry, VideoEntry } from "./publish.type";

export const getFromPath = (obj: any, path: string): any =>
  path.split(".").reduce((acc, part) => acc?.[part], obj);

export const isValidTextField = (field: EditableField): boolean => {  
  if (!field || field.dataType !== DynamicDataType.Text) return false;
  const val = field.current.value;
  return typeof val === "string";
};

export const isValidImageField = (field: EditableField): boolean => {
  if (!field || field.dataType !== DynamicDataType.Image) return false;
  const val = field.current.value;
  if (!val || typeof val !== "object") return false;
  const img = val as ImageEntry;
  return !!(img.previewUrl || img.remoteUrl);
};

export const isValidVideoField = (field: EditableField): boolean => {
  if (!field || field.dataType !== DynamicDataType.Video) return false;
  const val = field.current.value;
  if (!val || typeof val !== "object") return false;
  const video = val as VideoEntry;
  return !!(video.previewUrl || video.remoteUrl);
};

export const isValidBooleanField = (field: EditableField): boolean => {
  if (!field || field.dataType !== DynamicDataType.Boolean) return false;
  return typeof field.current.value === "boolean";
};

