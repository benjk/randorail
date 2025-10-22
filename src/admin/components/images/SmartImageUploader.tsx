import React, { useEffect, useRef, useState } from 'react';
import { processImage } from './imageValidation';
import './smartImageUploader.scss';
import '../commons/uploaders.scss';
import { SmartUploaderActions } from '../ui/SmartUploaderActions';
import {
  DynamicDataType,
  EditableField,
  EditableFieldOptions,
  ImageEntry,
} from '../publish/publish.type';
import { useAdminData } from '../publish/useAdminData';
import { generateFavicons } from './imageUtils';
import { ImageRule } from './imageRulesFactory';
import { AlertTriangle } from 'lucide-react';

export const SmartImageUploader: React.FC<{
  imageKey: string;
  imageRule: ImageRule;
  fieldIndex?: number;
  canRemove?: boolean;
  canAdd?: boolean;
  canReorder?: boolean;
  onRemoveField?(fieldKey: string): void;
  onCreateField?(targetKey: string): void;
  dragItemHandleProps?: React.HTMLAttributes<HTMLElement>;
}> = React.memo(
  ({
    imageKey,
    imageRule,
    fieldIndex,
    canRemove,
    canAdd,
    canReorder,
    onRemoveField,
    onCreateField,
    dragItemHandleProps,
  }) => {
    const rules = imageRule;
    const supportedTypes = rules.supportedTypes!;
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { setEditableValue, createNewField } = useAdminData().fields;
    const {
      field,
      currentValue: currentImage,
      initialValue: initialImage,
    } = useAdminData().fields.useFieldStore(imageKey) as {
      field: EditableField;
      currentValue: ImageEntry;
      initialValue: ImageEntry;
    };

    // Valeurs courantes et initiales depuis le contexte
    const currentPreviewUrl = currentImage?.previewUrl || '';
    const currentFileName =
      currentImage?.file?.name || currentImage?.remoteUrl || '';
    const initialPreviewUrl_context = initialImage?.previewUrl || '';

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [displayExtraInfo, setDisplayExtraInfo] = useState(false);

    const hasChanged = React.useMemo(() => {
      return (
        !!currentImage?.file ||
        currentImage?.remoteUrl !== initialImage?.remoteUrl
      );
    }, [currentImage, initialImage]);

    useEffect(() => {
      if (field) {
        if (!field.inError) setError(null);
      }
    }, [field]);

    useEffect(() => {
      const isEmpty =
        !currentImage?.previewUrl && currentImage?.file === undefined;

      if (!isEmpty) return;

      const isPortrait = imageRule.imgFormat === 'portrait';
      const defaultUrl = isPortrait
        ? '/img/static/defaultNewImgVertical.webp'
        : '/img/static/defaultNewImg.webp';

      const initDefaultImage = async () => {
        try {
          const res = await fetch(defaultUrl);
          const blob = await res.blob();

          const fileName = defaultUrl.split('/').pop() || 'defaultImage.webp';
          const file = new File([blob], fileName, {
            type: blob.type,
            lastModified: Date.now(),
          });

          setEditableValue(
            imageKey,
            {
              file,
              previewUrl: URL.createObjectURL(file),
              remoteUrl: '',
            },
            imageRule,
          );
        } catch (err) {
          console.error('Erreur chargement image par défaut :', err);
        }
      };

      initDefaultImage();
    }, []);

    const rollbackToInitial = (error: string | null = null) => {
      setError(error);
      setWarning(null);
      setEditableValue(imageKey, initialImage, imageRule);
    };

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    };

    const triggerFileInput = (): void => {
      if (fileInputRef.current && !isProcessing) {
        fileInputRef.current.click();
      }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    };

    const searchFor = () => {
      const target = rules.linkTo;
      if (target) {
        if (!error && currentPreviewUrl) {
          sessionStorage.setItem(
            `preview${target.selector}`,
            currentPreviewUrl,
          );
        } else {
          sessionStorage.removeItem(`preview${target.selector}`);
        }
        window.open(`${target.route}${target.selector}?show=true`, '_blank');
      } else {
        setDisplayExtraInfo(!displayExtraInfo);
      }
    };

    const rollback = () => {
      setError(null);
      setWarning(null);
      rollbackToInitial();
    };

    const handleFile = async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setWarning(null);

      const result = await processImage(file, rules);

      if (result.error) {
        setError(result.error);
        setIsProcessing(false);
      } else if (result.file && result.previewUrl) {
        if (result.warning) setWarning(result.warning);
        if (rules.autoGenerateIcons) {
          await handleGeneratedIcons(result.file, imageKey);
        } else {
          console.log('AJOUT DIMAGE : ', result);

          setEditableValue(
            imageKey,
            {
              file: result.file,
              previewUrl: result.previewUrl,
              remoteUrl: currentImage?.remoteUrl || '',
            },
            imageRule,
          );
        }
        setIsProcessing(false);
      }
    };

    // Gestion des erreurs d'image qui ne se chargent pas
    const handleImageError = () => {
      if (
        currentPreviewUrl &&
        currentPreviewUrl !== initialPreviewUrl_context
      ) {
        console.log('Image failed to load, reverting to initial');
        setError("L'image n'a pas pu être chargée.");
        rollbackToInitial();
      }
    };

    const handleGeneratedIcons = async (file: File, imageKey: string) => {
      const generated = await generateFavicons(file);

      setEditableValue(
        imageKey,
        {
          file: file,
          previewUrl: URL.createObjectURL(file),
          remoteUrl: '',
        },
        imageRule,
      );

      generated.forEach(({ name, blob }) => {
        if (name === 'favicon.png') return;
        const f = new File([blob], name, { type: 'image/png' });
        // Créer un objet FieldOptions pour chaque icône
        const fieldOptions: EditableFieldOptions = {
          dataType: DynamicDataType.Image,
          label: `icon_${name}`,
          isNew: true,
          isGenerated: true,
        };

        createNewField(`icon_${name}`, fieldOptions, {
          file: f,
          previewUrl: URL.createObjectURL(f),
          remoteUrl: '',
        });
      });
    };

    return (
      <div
        className="uploader-container image-uploader"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <SmartUploaderActions
          onSearch={searchFor}
          onRollback={rollback}
          hasChanged={hasChanged}
          isDuplicable={imageRule.isDuplicable}
          canRemove={canRemove}
          canAdd={canAdd}
          canReorder={canReorder}
          onRemove={onRemoveField ? () => onRemoveField(imageKey) : undefined}
          onAdd={onCreateField ? () => onCreateField(imageKey) : undefined}
          dragItemHandleProps={dragItemHandleProps}
        />

        <div className="uploader-data-container image-data-container">
          <h3 className="uploader-label">
            {rules.label}
            {fieldIndex !== undefined && ` ${fieldIndex + 1}`}
          </h3>
          <div
            className={`drop-container ${isProcessing ? 'loading' : ''}`}
            id="dropcontainer"
            onClick={triggerFileInput}
          >
            {isProcessing ? (
              <span className="loader" />
            ) : (
              <div className="label-container">
                <p className="drop-title">Cliquer</p>
                <p className="drop-title">ou</p>
                <p className="drop-title">Déposer vos fichiers</p>
              </div>
            )}
          </div>

          <input
            key={currentFileName + (error || '')}
            type="file"
            id="file-upload"
            ref={fileInputRef}
            accept={supportedTypes.join(',')}
            required
            onChange={onChange}
          />

          {displayExtraInfo && rules.extraInfo && (
            <p className="text-info extra-info">{rules.extraInfo}</p>
          )}

          <div className="message-container">
            {error ? (
              <>
                <AlertTriangle className="input-error-icon" />
                <p className="text-info error-msg">Erreur - {error}</p>
              </>
            ) : currentFileName ? (
              <p className="text-info file-name">
                <span className="strong">Fichier: </span>
                {currentFileName}
              </p>
            ) : null}
            {warning && <p className="text-info image-warning">{warning}</p>}
          </div>
        </div>

        <div className="img-prev-container">
          {currentPreviewUrl ? (
            <img
              src={currentPreviewUrl}
              alt="Preview"
              className="image-preview"
              onError={handleImageError}
            />
          ) : (
            <div className="image-preview-placeholder">Aucune image</div>
          )}
        </div>
      </div>
    );
  },
);
