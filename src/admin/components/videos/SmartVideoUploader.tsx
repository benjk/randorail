import React, { useRef, useState } from 'react';
import { processVideo } from './videoValidation';
import './smartVideoUploader.scss';
import '../commons/uploaders.scss';
import { SmartUploaderActions } from '../ui/SmartUploaderActions';
import { EditableField, VideoEntry } from '../publish/publish.type';
import { useAdminData } from '../publish/useAdminData';
import { VideoRule } from './videoRulesFactory';
import { AlertTriangle, Play, Film, Pause } from 'lucide-react';

export const SmartVideoUploader: React.FC<{
  videoKey: string;
  videoRule: VideoRule;
  fieldIndex?: number;
  canRemove?: boolean;
  canAdd?: boolean;
  canReorder?: boolean;
  onRemoveField?(fieldKey: string): void;
  onCreateField?(targetKey: string): void;
  dragItemHandleProps?: React.HTMLAttributes<HTMLElement>;
}> = React.memo(
  ({
    videoKey,
    videoRule,
    fieldIndex,
    canRemove,
    canAdd,
    canReorder,
    onRemoveField,
    onCreateField,
    dragItemHandleProps,
  }) => {
    const { setEditableValue } = useAdminData().fields;
    const {
      field,
      currentValue: currentVideo,
      initialValue: initialVideo,
    } = useAdminData().fields.useFieldStore(videoKey) as {
      field: EditableField;
      currentValue: VideoEntry;
      initialValue: VideoEntry;
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [displayExtraInfo, setDisplayExtraInfo] = useState(false);

    const currentPreviewUrl = currentVideo?.previewUrl || '';
    const currentFileName =
      currentVideo?.file?.name || currentVideo?.remoteUrl || '';

    const hasChanged =
      !!currentVideo?.file ||
      currentVideo?.remoteUrl !== initialVideo?.remoteUrl;

    const rollbackToInitial = (err: string | null = null) => {
      setError(err);
      setEditableValue(videoKey, initialVideo, videoRule);
    };

    const triggerFileInput = () => {
      if (!isProcessing) fileInputRef.current?.click();
    };

    const handleFile = async (file: File) => {
      setIsProcessing(true);
      setError(null);

      const result = await processVideo(file, videoRule);

      if (result.error) {
        setError(result.error);
        console.log("PROBLEM DE VIDEO PROCESSING");
        
    } else if (result.file && result.previewUrl) {
        // Update store avec le nouveau fichier et la preview
        setEditableValue(
          videoKey,
          {
            file: result.file,
            previewUrl: result.previewUrl,
            remoteUrl: '', // pas de remoteUrl pour un upload local
          },
          videoRule,
        );

        // Met à jour la preview affichée directement
        if (videoRef.current) {
          videoRef.current.src = result.previewUrl;
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }

        console.log('Vidéo compressée :', result.file);
        console.log(result);
        
      }

      setIsProcessing(false);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    };

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    };

    const searchFor = () => {
      const target = videoRule.linkTo;
      if (target) {
        if (currentPreviewUrl)
          sessionStorage.setItem(
            `preview${target.selector}`,
            currentPreviewUrl,
          );
        else sessionStorage.removeItem(`preview${target.selector}`);
        window.open(`${target.route}${target.selector}?show=true`, '_blank');
      } else setDisplayExtraInfo(!displayExtraInfo);
    };

    const rollback = () => rollbackToInitial();

    const handleVideoError = () => {
      if (currentPreviewUrl !== initialVideo?.previewUrl)
        rollbackToInitial("La vidéo n'a pas pu être chargée.");
    };

    const togglePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div
        className="uploader-container video-uploader"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <SmartUploaderActions
          onSearch={searchFor}
          onRollback={rollback}
          hasChanged={hasChanged}
          isDuplicable={videoRule.isDuplicable}
          canRemove={canRemove}
          canAdd={canAdd}
          canReorder={canReorder}
          onRemove={onRemoveField ? () => onRemoveField(videoKey) : undefined}
          onAdd={onCreateField ? () => onCreateField(videoKey) : undefined}
          dragItemHandleProps={dragItemHandleProps}
        />

        <div className="uploader-data-container video-data-container">
          <h3 className="uploader-label">
            {videoRule.label}
            {fieldIndex !== undefined && ` ${fieldIndex + 1}`}
          </h3>

          <div
            className={`drop-container ${isProcessing ? 'loading' : ''}`}
            onClick={triggerFileInput}
          >
            {isProcessing ? (
              <span className="loader" />
            ) : (
              <div className="label-container">
                <p className="drop-title">Cliquer</p>
                <p className="drop-title">ou</p>
                <p className="drop-title">Déposer une vidéo</p>
              </div>
            )}
          </div>

          <input
            key={currentFileName + (error || '')}
            type="file"
            ref={fileInputRef}
            accept={videoRule.supportedTypes!.join(',')}
            onChange={onChange}
            hidden
          />

          {displayExtraInfo && videoRule.extraInfo && (
            <p className="text-info extra-info">{videoRule.extraInfo}</p>
          )}

          <div className="message-container">
            {error ? (
              <>
                <AlertTriangle className="input-error-icon" />
                <p className="text-info error-msg">Erreur - {error}</p>
              </>
            ) : currentFileName ? (
              <p className="text-info file-name">
                <span className="strong">Fichier : </span>
                {currentFileName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="video-prev-container">
          {currentPreviewUrl ? (
            <div className="video-preview-wrapper">
              <video
                ref={videoRef}
                src={currentPreviewUrl}
                className="video-preview"
                onError={handleVideoError}
                loop
                muted
                playsInline
              />
              <button
                className="video-play-button"
                onClick={togglePlayPause}
                type="button"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
            </div>
          ) : (
            <div className="video-preview-placeholder">
              <Film size={64} />
              <p>Aucune vidéo</p>
            </div>
          )}
        </div>
      </div>
    );
  },
);
