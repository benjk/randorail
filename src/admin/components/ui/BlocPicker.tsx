import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlocPickerRule } from '../../data/blocPickerRules';
import { blocRules } from '../../data/blocRules';
import { useAdminData } from '../publish/useAdminData';
import { SmartUploaderActions } from './SmartUploaderActions';
import { createPortal } from 'react-dom';

interface BlocPickerProps {
  pickerKey: string;
  pickerRule: BlocPickerRule;
}

export const BlocPicker: React.FC<BlocPickerProps> = ({
  pickerKey,
  pickerRule,
}) => {
  // Custom select
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { blocPickers, blocs, fields } = useAdminData();
  const { picker, currentValue, initialValue } =
    blocPickers.useBlocPickerStore(pickerKey);

  const canToggle = pickerRule.canBeDraft ?? true;

  const enabled = canToggle ? currentValue.enabled : true;
  const isDisabled = canToggle && !enabled;

  const selection = currentValue.sourceBlocKey
    ? {
        sourceBlocKey: currentValue.sourceBlocKey,
        blocIndex: currentValue.blocIndex,
      }
    : null;

  const [displayExtraInfo, setDisplayExtraInfo] = useState(false);

  const hasChanged = React.useMemo(() => {
    return (
      initialValue &&
      (currentValue.enabled !== initialValue.enabled ||
        currentValue.sourceBlocKey !== initialValue.sourceBlocKey ||
        currentValue.blocIndex !== initialValue.blocIndex)
    );
  }, [currentValue, initialValue]);

  const [titleFieldsVersion, setTitleFieldsVersion] = useState(0);
  const [blocsVersion, setBlocsVersion] = useState(0);

  const relevantFields = React.useMemo(() => {
    return fields.getFieldTitleForBlocs(pickerRule.allowedSourceBlocs);
  }, [pickerRule.allowedSourceBlocs, titleFieldsVersion, blocsVersion]);

  useEffect(() => {
    const fieldKeys = Object.keys(relevantFields);

    if (fieldKeys.length === 0) return;

    // Callback qui force le re-render quand une VALEUR de titre change
    const handleTitleFieldChange = () => {
      setTitleFieldsVersion((v) => v + 1);
    };

    // S'abonner uniquement aux fields TITLE pertinents
    const unsubscribe = fields.subscribeFields(
      fieldKeys,
      handleTitleFieldChange,
    );

    return () => {
      unsubscribe();
    };
  }, [relevantFields]);

  // Écoute des changements sur les blocs concernés (add/delete)
  useEffect(() => {
    const allowedBlocKeys = pickerRule.allowedSourceBlocs;

    if (allowedBlocKeys.length === 0) return;

    // Callback qui force le re-render quand un bloc est ajouté/supprimé
    const handleBlocChange = () => {
      setBlocsVersion((v) => v + 1);
    };

    // S'abonner uniquement aux blocGroups concernés
    const unsubscribe = blocs.subscribeBlocs(allowedBlocKeys, handleBlocChange);

    return () => {
      unsubscribe();
    };
  }, [blocs, pickerRule.allowedSourceBlocs]);

  // Hook pour récupérer les items disponibles
  const availableItems = useMemo(() => {
    return pickerRule.allowedSourceBlocs.flatMap((blocKey) => {
      const blocGroup = blocs.getBlocGroup(blocKey);
      if (!blocGroup) return [];

      const blocRule = blocRules[blocKey];

      return Object.values(blocGroup.blocInstances)
        .filter((instance) => {
          if (instance.isDeleted) return false;
          if (instance.inError) return false;
          if (!pickerRule.canBeDraft) return false;
          return true;
        })
        .map((instance) => {
          let title = `${blocRule.itemLabel} ${instance.index + 1}`;

          const titleFieldKey = Object.keys(relevantFields).find((key) => {
            const parts = key.split('.');
            if (parts.length < 3) return false;
            return (
              parts[0] === blocKey && parts[2] === instance.index.toString()
            );
          });

          if (titleFieldKey) {
            const field = relevantFields[titleFieldKey];
            if (
              field &&
              typeof field.current.value === 'string' &&
              field.current.value
            ) {
              title = field.current.value;
            }
          }

          return {
            blocKey,
            blocIndex: instance.index,
            title,
            blocLabel: blocRule.itemLabel,
          };
        });
    });
  }, [pickerRule.allowedSourceBlocs, relevantFields, blocsVersion]);

  const currentSelection = useMemo(() => {
    if (!selection) return availableItems[0];
    const found = availableItems.find(
      (i) =>
        i.blocKey === selection.sourceBlocKey &&
        i.blocIndex === selection.blocIndex,
    );
    return found || availableItems[0];
  }, [selection, availableItems]);

  // Sync store si selection invalide
  useEffect(() => {
    if (!selection) return;
    const isValid = availableItems.some(
      (i) =>
        i.blocKey === selection.sourceBlocKey &&
        i.blocIndex === selection.blocIndex,
    );
    if (!isValid && availableItems.length > 0) {
      const first = availableItems[0];
      handleSelectionChange(`${first.blocKey}.${first.blocIndex}`);
    }
  }, [availableItems, selection]);

  const handleEnabledChange = (checked: boolean) => {
    blocPickers.setBlocPickerValue(pickerKey, {
      enabled: checked,
      sourceBlocKey: selection?.sourceBlocKey || '',
      blocIndex: selection?.blocIndex ?? 0,
    });
  };

  const handleSelectionChange = (value: string) => {
    if (!value) {
      blocPickers.setBlocPickerValue(pickerKey, {
        enabled,
        sourceBlocKey: '',
        blocIndex: 0,
      });
      return;
    }

    const [sourceBlocKey, blocIndex] = value.split('.');
    const newSelection = {
      sourceBlocKey,
      blocIndex: parseInt(blocIndex),
    };

    blocPickers.setBlocPickerValue(pickerKey, {
      enabled,
      ...newSelection,
    });
  };

  const rollback = () => {
    blocPickers.setBlocPickerValue(pickerKey, initialValue);
  };

  const searchFor = () => {
    setDisplayExtraInfo((v) => !v);
  };

  return (
    <div className="uploader-container bloc-picker">
      <SmartUploaderActions
        onSearch={searchFor}
        onRollback={rollback}
        hasChanged={hasChanged}
        canRemove={false}
        canAdd={false}
        canReorder={false}
      />

      <div className="uploader-data-container text-data-container">
        <h3 className="uploader-label">{pickerRule.title}</h3>{' '}
        {displayExtraInfo && pickerRule.extraInfo && (
          <p className="text-info extra-info">{pickerRule.extraInfo}</p>
        )}
      </div>

      <div className="bloc-picker-container">
        {canToggle && (
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
            />
            <span>Afficher sur le site</span>
          </label>
        )}
        <div className="label-container">
          <div className="custom-select-container" ref={triggerRef}>
            <div
              className={`custom-select-trigger ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!isDisabled) {
                  setIsOpen(!isOpen);
                }
              }}
            >
              <span className="truncate">
                {currentSelection
                  ? `${currentSelection.blocLabel} - ${currentSelection.title}`
                  : 'Sélectionner...'}
              </span>
            </div>
            {isOpen &&
              !isDisabled &&
              createPortal(
                <div
                  ref={dropdownRef}
                  className="custom-options"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                >
                  {availableItems.map((item) => (
                    <div
                      key={`${item.blocKey}.${item.blocIndex}`}
                      className="custom-option"
                      onClick={() => {
                        handleSelectionChange(
                          `${item.blocKey}.${item.blocIndex}`,
                        );
                        setIsOpen(false);
                      }}
                    >
                      {item.blocLabel} - {item.title}
                    </div>
                  ))}
                </div>,
                document.body,
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
