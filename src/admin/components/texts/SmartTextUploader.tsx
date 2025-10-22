import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import './smartTextUploader.scss';
import '../commons/uploaders.scss';
import { SmartUploaderActions } from '../ui/SmartUploaderActions';
import { AlertTriangle } from 'lucide-react';
import { patternsByTextType } from './patterns';
import { sanitizeText } from './textSanitizer';
import { useAdminData } from '../publish/useAdminData';
import { TextRule } from './textRulesFactory';
import { useTextareaAutoResize } from './useTextAreaAutoResize';
import { EditableField } from '../publish/publish.type';

export const SmartTextUploader: React.FC<{
  textKey: string;
  textRules: TextRule;
  fieldIndex?: number;
  canRemove?: boolean;
  canAdd?: boolean;
  canReorder?: boolean;
  onRemoveField?(fieldKey: string): void;
  onCreateField?(targetKey: string): void;
  dragItemHandleProps?: React.HTMLAttributes<HTMLElement>;
}> = React.memo(
  ({
    textKey,
    textRules,
    fieldIndex,
    canRemove,
    canAdd,
    canReorder,
    onRemoveField,
    onCreateField,
    dragItemHandleProps,
  }) => {
    const rules = textRules;
    if (!rules) return null;

    const textType = rules.textType || 'text';
    const patternRules = patternsByTextType[textType];

    const { setEditableValue } = useAdminData().fields;
    const { field, currentValue, initialValue } =
      useAdminData().fields.useFieldStore(textKey) as {
        field: EditableField;
        currentValue: string;
        initialValue: string;
      };

    const {
      control,
      setError,
      clearErrors,
      reset,
      formState: { errors },
      watch,
    } = useForm({
      defaultValues: { value: currentValue },
      mode: 'onBlur',
    });

    const value = watch('value');

    const hasChanged = React.useMemo(() => {
      return initialValue && value !== initialValue && initialValue.length > 0;
    }, [currentValue, initialValue]);

    const [isValid, setIsValid] = useState(false);
    const [displayExtraInfo, setDisplayExtraInfo] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const errorType = field?.inError
      ? errors.value?.message || 'context'
      : undefined;
    const isTextarea = rules.lineBreakable;

    // On resync la value une fois le field chargé depuis le store, Obligatoire coté text car Couche react-hook-form en +
    useEffect(() => {
      if (field) {
        reset({ value: currentValue });
      }
    }, [field]);

    // Permet de check les errors au PREMIER rendu, donc à la création vide -> error
    useEffect(() => {
      const isValid = checkError(value);
      if (!isValid) {
        // push l'erreur au store
        setTextReady(value, isValid);
      }
    }, []);

    const validateValue = (val: string) => {
      const cleanVal = sanitizeText(val, isTextarea);
      const tooShort = cleanVal.length < rules.minLength;
      const tooLong = val.length > rules.maxLength;
      const patternMismatch = patternRules && !patternRules.pattern.test(val);
      const valid = !tooShort && !tooLong && !patternMismatch;
      setIsValid(valid);
      return { isValid: valid, tooShort, tooLong, patternMismatch };
    };

    const checkError = (val: string): boolean => {
      const { isValid, tooShort, tooLong, patternMismatch } =
        validateValue(val);

      if (isValid) {
        clearErrors('value');
      } else if (tooShort || tooLong) {
        setError('value', { type: 'manual', message: 'length' });
      } else if (patternMismatch) {
        setError('value', { type: 'manual', message: 'pattern' });
      }

      return isValid;
    };

    const setTextReady = (val: string, isValid: boolean = true) => {
      setEditableValue(textKey, val, textRules, isValid);
    };

    const handleInput = (e: React.FormEvent<EventTarget>) => {
      const val = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
      const isValid = checkError(val);
      setTextReady(val, isValid);
    };

    const handleBlur = () => {
      checkError(value);
    };

    const rollback = () => {
      reset({ value: initialValue });
      clearErrors('value');
      setIsValid(validateValue(initialValue).isValid);
      setTextReady(initialValue);
    };

    const searchFor = () => {
      const target = rules.linkTo;
      if (!target) {
        setDisplayExtraInfo((v) => !v);
        return;
      }

      if (isValid) {
        sessionStorage.setItem(
          `preview${target.selector}`,
          sanitizeText(value, isTextarea),
        );
      } else {
        sessionStorage.removeItem(`preview${target.selector}`);
      }

      window.open(`${target.route}${target.selector}?show=true`, '_blank');
    };

    return (
      <div className="uploader-container text-uploader">
        <SmartUploaderActions
          onSearch={searchFor}
          onRollback={rollback}
          hasChanged={hasChanged || false}
          isDuplicable={textRules.isDuplicable}
          canRemove={canRemove}
          canAdd={canAdd}
          canReorder={canReorder}
          onRemove={onRemoveField ? () => onRemoveField(textKey) : undefined}
          onAdd={onCreateField ? () => onCreateField(textKey!) : undefined}
          dragItemHandleProps={dragItemHandleProps}
        />

        <div className="uploader-data-container text-data-container">
          <h3 className="uploader-label">
            {rules.label}
            {fieldIndex !== undefined && ` ${fieldIndex + 1}`}
          </h3>{' '}
          {displayExtraInfo && rules.extraInfo && (
            <p className="text-info extra-info">{rules.extraInfo}</p>
          )}
          <div className="text-info-container">
            <p
              className={`text-info ${errorType === 'length' ? 'error-msg' : ''}`}
            >
              {errorType === 'length' && (
                <AlertTriangle className="input-error-icon" />
              )}
              <span className="strong">Longueur: </span>
              {rules.minLength === rules.maxLength
                ? `${rules.minLength} caractères`
                : `${rules.minLength} à ${rules.maxLength} caractères`}
            </p>
            {patternRules?.formatInfo && (
              <p
                className={`text-info ${
                  errorType === 'pattern' ? 'error-msg' : ''
                }`}
              >
                {errorType === 'pattern' && (
                  <AlertTriangle className="input-error-icon" />
                )}

                <span className="strong">Format: </span>
                {patternRules.formatInfo}
              </p>
            )}
          </div>
        </div>

        <Controller
          name="value"
          control={control}
          render={({ field }) => {
            const commonProps = {
              ...field,
              onInput: handleInput,
              onBlur: handleBlur,
              className: `text-input ${errorType ? 'error' : ''}`,
            };
            if (isTextarea && textareaRef !== null) {
              useTextareaAutoResize(textareaRef, field.value);
            }
            return (
              <div className="input-wrapper">
                {errorType && <AlertTriangle className="input-error-icon" />}
                {isTextarea ? (
                  <textarea {...commonProps} ref={textareaRef} />
                ) : (
                  <input {...commonProps} type="text" autoComplete="off" />
                )}
              </div>
            );
          }}
        />
      </div>
    );
  },
);
