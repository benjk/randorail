import { getModifiedBlocPickers } from './../commons/blocPickerStore';
import { getField } from '../commons/fieldStore';
import { textRules } from '../../data/textRules';
import { imageRules } from '../../data/imageRules';
import { blocRules } from '../../data/blocRules';
import {
  DynamicDataType,
  ImageEntry,
  ServerMessageType,
  PublishError,
  ModifiedFieldVM,
  ModifiedBlocVM,
  extractMutableProps,
  BlocPickerState,
} from './publish.type';
import {
  buildImagePath,
  cleanFileName,
  inferMimeType,
} from '../images/imageUtils';
import { markDeploymentAsMine } from './useDeploymentData';
import { serverMessages } from './messages';
import {
  applyMutablePropsToJson,
  cleanOrderData,
  getValueAtJsonPath,
  includesValueInScope,
  removeBlocFromJson,
  resolveBlocJsonPath,
  resolveFieldJsonPath,
  setValueAtPath,
} from './jsonHelpers';
import { ImageRule } from '../images/imageRulesFactory';
import { TextRule } from '../texts/textRulesFactory';

interface GeneratedContent {
  jsonContent: any;
  filesToUpload: { file: File; fieldname: string }[];
  filesToDelete: string[];
}

/** Fonction principale de publication du contenu dynamique */
export async function publish(
  generatedContent: GeneratedContent,
  jwt: string,
  pushMessage: (msg: string, type?: ServerMessageType) => void,
) {
  const funUrl = import.meta.env.PUBLIC_PUBLISH_FUNCTION_URL;

  const jsonContent = generatedContent.jsonContent;
  const filesToUpload = generatedContent.filesToUpload;
  const filesToDelete = generatedContent.filesToDelete;

  const formData = new FormData();
  console.log('Publishing data:', jsonContent);
  console.log('Files to upload:', filesToUpload);
  console.log('Files to Delete:', filesToDelete);

  formData.append('content', JSON.stringify(jsonContent));
  formData.append('filesToDelete', filesToDelete.join(','));

  for (const { file, fieldname } of filesToUpload) {
    if (!file) continue;
    formData.append(fieldname, file);
  }

  const response = await fetch(funUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new PublishError(response.status, error.error || 'Erreur inconnue');
  }

  const result = await response.json();

  if (result.deployId) {
    markDeploymentAsMine(result.deployId);
    pushMessage(serverMessages.publishingStart);
  }
  return result;
}

export async function generateContentForPublish(
  modifiedFields: ModifiedFieldVM[],
  modifiedBlocs: ModifiedBlocVM[],
  modifiedBlocPickers: BlocPickerState[],
  storedJsonString: string,
  contentVersion?: string,
): Promise<GeneratedContent> {
  const jsonContent = JSON.parse(storedJsonString);
  const filesToUpload: { file: File; fieldname: string }[] = [];
  const filesToDelete: string[] = [];

  // Gestion de la version
  if (contentVersion) {
    jsonContent.contentVersion = contentVersion;
  }

  console.log('MODIFIED BLOCS:', modifiedBlocs);
  console.log('MODIFIED FIELDS:', modifiedFields);
  console.log('MODIFIED BLOC PICKERS:', modifiedBlocPickers);

  // === 1. TRAITEMENT DES BLOCS ===
  const fieldsFromBlocs = await processModifiedBlocs(
    modifiedBlocs,
    jsonContent,
    filesToDelete,
  );

  // === 1.5 TRAITEMENT DES BLOC PICKERS === (NOUVEAU)
  processModifiedBlocPickers(modifiedBlocPickers, jsonContent);

  // Fusionner tous les champs à traiter
  const allFields = [...modifiedFields, ...fieldsFromBlocs];

  // === 2. SÉPARATION DES CHAMPS DUPLICABLES ET SIMPLES ===
  const { duplicableGroups, simpleFields } = categorizeFields(allFields);

  console.log('DUPLICABLE FIELDS GROUPED:', duplicableGroups);
  console.log('SIMPLE FIELDS:', simpleFields);

  // === 3. TRAITEMENT DES CHAMPS DUPLICABLES ===
  await processDuplicableFieldGroups(
    duplicableGroups,
    jsonContent,
    filesToUpload,
    filesToDelete,
  );

  // === 4. TRAITEMENT DES CHAMPS SIMPLES ===
  await processSimpleFields(
    simpleFields,
    jsonContent,
    filesToUpload,
    filesToDelete,
  );

  // === 5. NETTOYAGE FINAL ===
  const cleanJson = cleanOrderData(jsonContent);

  return { jsonContent: cleanJson, filesToUpload, filesToDelete };
}

/**
 * Détermine quelle règle utiliser selon le contexte (bloc ou field simple)
 */
export function getRuleForField(
  editableKey: string,
  fieldType: DynamicDataType,
  partOfBloc = false,
): any | null {
  const isBloc = partOfBloc;
  const parts = editableKey.split('.');
  const blocKey = parts[0];
  const itemKey = isBloc ? parts[1] : parts[0];

  if (fieldType === DynamicDataType.Text) {
    if (isBloc) {
      const blocRule = blocRules[blocKey];
      return blocRule?.textFields?.[itemKey] || null;
    }
    return textRules[itemKey] || null;
  }

  if (fieldType === DynamicDataType.Image) {
    if (isBloc) {
      const blocRule = blocRules[blocKey];
      return blocRule?.imageFields?.[itemKey] || null;
    }
    return imageRules[itemKey] || null;
  }

  return null;
}

/**
 * Traite les blocs modifiés et isole les champs extraits
 */
async function processModifiedBlocs(
  modifiedBlocs: ModifiedBlocVM[],
  jsonContent: any,
  filesToDelete: string[],
): Promise<ModifiedFieldVM[]> {
  const extractedFields: ModifiedFieldVM[] = [];

  for (const bloc of modifiedBlocs) {
    const blocJsonPath = resolveBlocJsonPath(
      bloc.blocKey,
      bloc.originalJsonIndex,
    );
    if (!blocJsonPath) continue;

    console.log('PROCESSING BLOC:', blocJsonPath, bloc.blocKey);

    // Gestion des blocs supprimés
    if (bloc.isDeleted && bloc.deletedFields) {
      await handleBlocDeletion(bloc, jsonContent, filesToDelete, blocJsonPath);
    }

    // Extraction des champs modifiés du bloc
    if (bloc.modifiedFields && Object.keys(bloc.modifiedFields).length > 0) {
      console.log('BLOC WITH MODIFIED FIELDS:', bloc);

      // Extraire les champs et leur donner le contexte du bloc
      Object.entries(bloc.modifiedFields).forEach(([key, field]) => {
        extractedFields.push({
          ...field,
          originalJsonIndex: bloc.originalJsonIndex,
        });
      });

      // Créer le bloc s'il est nouveau
      if (bloc.isNew) {
        console.log('NEW BLOC DETECTED:', bloc);
        applyMutablePropsToJson(
          blocJsonPath,
          extractMutableProps(bloc),
          jsonContent,
        );
      }
    }

    // Réorganisation des blocs
    if (bloc.isReordered) {
      console.log('BLOC REORDERED: applying mutable props');
      applyMutablePropsToJson(
        blocJsonPath,
        extractMutableProps(bloc),
        jsonContent,
      );
    }
  }

  return extractedFields;
}

/**
 * Gère la suppression d'un bloc et de ses images
 */
async function handleBlocDeletion(
  bloc: ModifiedBlocVM,
  jsonContent: any,
  filesToDelete: string[],
  blocJsonPath: string,
): Promise<void> {
  console.log('BLOC SHOULD BE DELETED:', bloc);

  // 1# Snapshot des images à suppr
  const imagesToCheck: string[] = [];
  for (const fieldKey of bloc.deletedFields!) {
    const dataType = getField(fieldKey)?.dataType;
    if (dataType === DynamicDataType.Image) {
      const fullJsonPath = resolveFieldJsonPath(
        fieldKey,
        dataType,
        bloc.originalJsonIndex,
      );
      if (!fullJsonPath) continue;

      const imageName = getValueAtJsonPath(jsonContent, fullJsonPath);
      if (imageName)
        imagesToCheck.push(
          buildImagePath(getRuleForField(fieldKey, dataType, true), imageName),
        );
    }
  }
  // 2# Suppression du bloc dans Json
  removeBlocFromJson(jsonContent, blocJsonPath);

  // 3# Après suppr on peut vérifier si l'img est utile ailleurs ou si on l'ajoute au filesToDelete
  for (const imgPath of imagesToCheck) {
    if (!includesValueInScope(jsonContent, imgPath)) {
      filesToDelete.push(cleanFileName(imgPath));
      console.log(`IMG ${imgPath} sera supprimée`);
    } else {
      console.log(`IMG ${imgPath} est encore utilisée`);
    }
  }
}

/**
 * Sépare les champs duplicables des champs simples
 */
function categorizeFields(fields: ModifiedFieldVM[]) {
  const duplicableGroups = new Map<string, ModifiedFieldVM[]>();
  const simpleFields: ModifiedFieldVM[] = [];

  for (const field of fields) {
    if (field.fieldIndex !== undefined) {
      const duplicabeFieldPath = resolveFieldJsonPath(
        field.key,
        field.dataType,
        field.originalJsonIndex,
      );
      if (duplicabeFieldPath) {
        if (!duplicableGroups.has(duplicabeFieldPath)) {
          duplicableGroups.set(duplicabeFieldPath, []);
        }
        duplicableGroups.get(duplicabeFieldPath)!.push(field);
      }
    } else {
      simpleFields.push(field);
    }
  }

  return { duplicableGroups, simpleFields };
}

/**
 * Traite un groupe de champs duplicables spécifique
 */
async function processDuplicableFieldGroups(
  duplicableGroups: Map<string, ModifiedFieldVM[]>,
  jsonContent: any,
  filesToUpload: { file: File; fieldname: string }[],
  filesToDelete: string[],
): Promise<void> {
  const allFilesToDelete: string[] = [];

  for (const [pathKey, fieldsGroup] of duplicableGroups.entries()) {
    const firstField = fieldsGroup[0];
    const fieldRule = getRuleForField(
      firstField.key,
      firstField.dataType,
      firstField.partOfBloc,
    );
    if (!fieldRule) return;
    console.log(`Processing duplicable field group: ${pathKey}`, fieldsGroup);

    // 1# Récupération du tableau par groupe
    const currentArray = getValueAtJsonPath(jsonContent, pathKey) || [];
    console.log('Current Array for duplicable fields : ', currentArray);

    // 2# Construction du nouveau tableau
    const { newArray, imagesToCheck } = buildNewArrayFromFields(
      fieldsGroup,
      currentArray,
      fieldRule,
      filesToUpload,
    );

    // 3# Mise à jour du JSON avec le nouveau tableau
    setValueAtPath(jsonContent, pathKey, newArray);

    // 4# On alimente le tab des img à check
    allFilesToDelete.push(...imagesToCheck);
  }

  // 5# Check final des files to delete
  allFilesToDelete.forEach((imagePath) => {
    if (!includesValueInScope(jsonContent, imagePath)) {
      filesToDelete.push(cleanFileName(imagePath));
      console.log(`IMG duplicable ${imagePath} sera supprimée`);
    }
  });
}

/**
 * Construit le tableau de valeur pour les fields Duplicables
 * Gère toutes les opérations (ADD, SUPPR, UP) et renvoie le tableau complet
 */
function buildNewArrayFromFields(
  fieldsGroup: ModifiedFieldVM[],
  currentArray: any[],
  fieldRule: any,
  filesToUpload: { file: File; fieldname: string }[],
): { newArray: any[]; imagesToCheck: string[] } {
  const imagesToCheck: string[] = [];

  const newArray = [...currentArray];

  // 1# Application des modifications hors Order
  for (const field of fieldsGroup) {
    const fieldIndex = field.fieldIndex!;
    // Si c'était une image, on vérifie pour traiter l'ancienne img file
    if (field.dataType === DynamicDataType.Image) {
      const oldImageName = currentArray[fieldIndex];
      if (oldImageName) {
        const oldImagePath = buildImagePath(fieldRule, oldImageName);
        imagesToCheck.push(oldImagePath);
      }
    }

    // 2# Traitement des Deleted
    if (field.isDeleted) {
      newArray[fieldIndex] = null;
    } else {
      // 3# Création de field Ou Update d'un field
      // Ajout de la value au tableau : ImageName ou stringValue
      if (field.dataType === DynamicDataType.Image) {
        const imgEntry = field.value as ImageEntry;
        if (imgEntry.file) {
          const imageName = imgEntry.file.name;
          newArray[fieldIndex] = imageName;
          const fieldname = buildImagePath(fieldRule, imageName);

          // Ajouter les new files Img aux filesToUpload (1 seule fois)
          const isAlreadyPresent = filesToUpload.some(
            (entry) => entry.fieldname === fieldname,
          );
          if (!isAlreadyPresent) {
            filesToUpload.push({
              file: new File([imgEntry.file], imageName, {
                type: imgEntry.file.type,
              }),
              fieldname,
            });
          }
        }
      } else {
        newArray[fieldIndex] = field.value;
      }
    }
  }

  // #4 On trie les éléments par ORDER quand on peut
  const sortedFinalArray: string[] = newArray
    .map((value, idx) => ({
      value,
      order: fieldsGroup.find((f) => f.fieldIndex === idx)?.order ?? idx + 1,
    }))
    .sort((a, b) => a.order - b.order)
    .map((f) => f.value as string);

  return {
    newArray: sortedFinalArray,
    imagesToCheck: [...new Set(imagesToCheck)],
  };
}

/**
 * Traite les champs simples (non duplicables)
 */
async function processSimpleFields(
  simpleFields: ModifiedFieldVM[],
  jsonContent: any,
  filesToUpload: { file: File; fieldname: string }[],
  filesToDelete: string[],
): Promise<void> {
  for (const field of simpleFields) {
    const { value, dataType, key: editableKey } = field;

    if (!value || !dataType || !editableKey) continue;

    const fieldRule = getRuleForField(editableKey, dataType, field.partOfBloc);
    if (!fieldRule) continue;

    console.log('Processing simple field:', editableKey, fieldRule);

    if (dataType === DynamicDataType.Image) {
      await processSimpleImageField(
        field,
        fieldRule,
        jsonContent,
        filesToUpload,
        filesToDelete,
      );
    } else if (dataType === DynamicDataType.Text) {
      processSimpleTextField(field, fieldRule, jsonContent);
    }
  }
}

/**
 * Traite les BlocPickers modifiés et met à jour le JSON
 */
function processModifiedBlocPickers(
  modifiedBlocPickers: BlocPickerState[],
  jsonContent: any,
): void {
  for (const picker of modifiedBlocPickers) {
    const { pickerKey, rule, current } = picker;

    if (!rule?.jsonKey || !current) {
      console.warn(`BlocPicker ${pickerKey} : règle ou toPublish manquant`);
      continue;
    }

    console.log(`Processing BlocPicker: ${pickerKey}`, current);

    // Mise à jour du JSON avec les valeurs du toPublish
    setValueAtPath(
      jsonContent,
      `${rule.jsonKey}.enabled`,
      String(current.enabled),
    );
    setValueAtPath(
      jsonContent,
      `${rule.jsonKey}.sourceBlocKey`,
      current.sourceBlocKey,
    );
    setValueAtPath(
      jsonContent,
      `${rule.jsonKey}.blocIndex`,
      String(current.blocIndex),
    );
  }
}

/**
 * Traite un champ image simple
 */
async function processSimpleImageField(
  field: ModifiedFieldVM,
  fieldRule: ImageRule,
  jsonContent: any,
  filesToUpload: { file: File; fieldname: string }[],
  filesToDelete: string[],
): Promise<void> {
  const imgEntry = field.value as ImageEntry;
  const imgName = imgEntry.remoteUrl;
  const fullImgPath = buildImagePath(fieldRule, imgName || '');

  // Cas particulier des icônes
  if (field.key.startsWith('icon_')) {
    if (imgEntry.file instanceof File) {
      await handleIconFile(imgEntry.file, field.key, filesToUpload);
    }
    return;
  }

  // Images normales
  handleImageFile(
    imgEntry,
    fieldRule,
    field.key,
    field.partOfBloc || false,
    jsonContent,
    filesToUpload,
    fullImgPath,
    filesToDelete,
    field.originalJsonIndex,
  );
}

/**
 * Traite un champ texte simple
 */
function processSimpleTextField(
  field: ModifiedFieldVM,
  fieldRule: TextRule,
  jsonContent: any,
): void {
  applyTextValue(
    jsonContent,
    fieldRule,
    field.key,
    field.partOfBloc || false,
    field.value as string,
    field.originalJsonIndex,
    field.fieldIndex,
  );
}

/**
 * Applique une valeur texte au jsonContent selon la règle
 */
export function applyTextValue(
  jsonContent: any,
  rule: any,
  editableKey: string,
  isBloc: boolean,
  value: string,
  originalJsonIndex?: number,
  fieldIndex?: number,
): void {
  let fullJsonPath = !isBloc
    ? rule.key
    : resolveFieldJsonPath(
        editableKey,
        DynamicDataType.Text,
        originalJsonIndex,
      );
  setValueAtPath(jsonContent, fullJsonPath, value);
}

function handleImageFile(
  img: ImageEntry,
  rule: ImageRule,
  editableKey: string,
  isBloc: boolean,
  jsonContent: any,
  filesToUpload: { file: File; fieldname: string }[],
  oldImagePath: string,
  filesToDelete: string[],
  originalJsonIndex?: number,
): void {
  let imageName: string;
  const file = img.file;
  if (!file) return;

  // Extraire le nom de fichier de l'ancienne image
  const oldImageName = oldImagePath.split('/').pop() || '';

  if (isBloc) {
    const path = resolveFieldJsonPath(
      editableKey,
      DynamicDataType.Image,
      originalJsonIndex,
    );
    if (!path) return;
    imageName = file.name;
    setValueAtPath(jsonContent, path, imageName);
  } else {
    imageName = rule.name;
  }

  /** 2. Ajouter la nouvelle image aux uploads */
  const fieldname = buildImagePath(rule, imageName);
  const isFieldnameAlreadyPresent = filesToUpload.some(
    (entry) => entry.fieldname === fieldname,
  );

  if (!isFieldnameAlreadyPresent) {
    filesToUpload.push({
      file: new File([file], imageName, { type: file.type }),
      fieldname,
    });
  }

  /** 3. Vérifier l'ancienne image APRÈS avoir mis la nouvelle */
  if (oldImageName && oldImageName !== imageName) {
    const oldImagePath = buildImagePath(rule, oldImageName);
    if (oldImagePath && !includesValueInScope(jsonContent, oldImagePath)) {
      filesToDelete.push(oldImagePath);
      console.log(`${oldImagePath} : image plus utilisée dans son scope`);
    } else {
      console.log(`${oldImagePath} : image encore utilisée dans son scope`);
    }
  }
}

/** Fonction pour gérer le cas particulier des icônes */
async function handleIconFile(
  file: File,
  editableKey: string,
  filesToUpload: { file: File; fieldname: string }[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      console.error('Error reading file');
      reject(new Error('Error reading file'));
    };

    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const filename = editableKey.replace(/^icon_/, '');
      const type =
        file.type || inferMimeType(filename) || 'application/octet-stream';

      const newFile = new File([arrayBuffer], filename, {
        type,
        lastModified: Date.now(),
      });

      filesToUpload.push({
        file: newFile,
        fieldname: `icons/${filename}`,
      });

      resolve();
    };

    reader.readAsArrayBuffer(file);
  });
}
