import React, { useEffect, useMemo, useState } from 'react';
import { useAdminData } from '../publish/useAdminData';
import { SmartTextUploader } from '../texts/SmartTextUploader';
import { SmartImageUploader } from '../images/SmartImageUploader';
import {
  BlocInstanceState,
  FieldKeyWithOrder,
  LocalFields,
} from '../publish/publish.type';
import { AlertTriangle, GripHorizontal, X } from 'lucide-react';
import { BlocRule } from './blocRulesFactory';
import {
  getBlocIndice,
  getGroupId,
  getSortedFieldKeys,
  parseBlocFullKey,
} from './blocHelper';
import { CollapsibleBloc } from '../nav/CollapsibleBloc';
import { ReorderableList } from './ReorderableList';

interface BlocInstanceProps {
  blocRule: BlocRule;
  bloc: BlocInstanceState;
  onRemove: (index: number) => void;
  allowRemove: boolean;
  onValidationChange: (index: number, hasError: boolean) => void; // Quand le bloc est en erreur, remonte l'info pour impacter la possibilité de supprimer les autres blocs
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isReordering: boolean;
}

export const BlocInstance: React.FC<BlocInstanceProps> = ({
  blocRule,
  bloc,
  onRemove,
  allowRemove = true,
  onValidationChange,
  dragHandleProps,
  isReordering,
}) => {
  console.log('COMING INTO BLOC INSTANCE : ', bloc);
  const { uiHooks, fields, snapshots } = useAdminData();
  const { blocKey, index } = bloc;
  let fieldKeys = useMemo(
    () => getSortedFieldKeys(bloc.fieldKeys, blocRule),
    [bloc],
  );

  const [localFields, setLocalFields] = useState<LocalFields>(
    groupFields(fieldKeys, bloc.fieldOrders || {}),
  );

  // Détection des rollback
  useEffect(() => {
    console.log('mes fields keys : ');
    console.log(fieldKeys);

    console.log('mes fields ORDERS : ');
    console.log(bloc.fieldOrders);

    setLocalFields(groupFields(fieldKeys, bloc.fieldOrders || {}));
  }, [snapshots.rollbackCount]);

  // Extraction de toutes les keys pour les hooks qui en ont besoin
  const allFieldKeys = useMemo(() => {
    const keys: string[] = [...localFields.singles];
    Object.values(localFields.groups).forEach((group) => {
      keys.push(...group.fields.map((f) => f.key));
    });
    return keys;
  }, [localFields]);
  // Genre CE HOOK
  const fieldCounts = uiHooks.useAllCleanDuplicableFieldInstances(allFieldKeys);
  
  
  // Map pour faciliter l'accès aux counts par key
  const countByKey = useMemo(() => {
    const map = new Map<string, number>();
    allFieldKeys.forEach((key, idx) => {
      map.set(key, fieldCounts[idx] ?? 0);
    });
    return map;
  }, [allFieldKeys, fieldCounts]);

  // Détermine si d'autres fields de ce bloc sont en erreur -> Bloc complet en erreur
  const blocHasError = uiHooks.useBlocInstanceError(blocKey, index);
  useEffect(() => {
    onValidationChange(index, blocHasError);
  }, [blocHasError]);

  const handleRemoveField = (fieldKey: string) => {
    console.log('Suppression du field:', fieldKey);
    fields.deleteFields(fieldKey);
    setLocalFields((prev) => {
      const newFields = { ...prev };

      // Retirer des singles
      newFields.singles = newFields.singles.filter((k) => k !== fieldKey);

      // Retirer des groups
      Object.keys(newFields.groups).forEach((groupId) => {
        const group = newFields.groups[groupId];
        group.fields = group.fields.filter((f) => f.key !== fieldKey);

        // Supprimer le groupe s'il est vide
        if (group.fields.length === 0) {
          delete newFields.groups[groupId];
        }
      });

      return newFields;
    });
  };

  const handleCreateField = async (targetKey: string) => {
    const parsedKey = parseBlocFullKey(targetKey);
    if (!parsedKey) return;

    const groupId = getGroupId(parsedKey);
    const existingGroup = localFields.groups[groupId];
    const nextOrder = existingGroup
      ? Math.max(...existingGroup.fields.map((f) => f.order)) + 1
      : 1;

    const newFieldKey = await fields.addDuplicableField(
      targetKey,
      blocKey,
      index,
      parsedKey.fieldKey,
      nextOrder,
    );
    if (newFieldKey) {
      console.log('Création du field:', newFieldKey);
      // Mise à jour des localFields
      setLocalFields((prev) => {
        const parsed = parseBlocFullKey(newFieldKey);
        if (!parsed) return prev;

        const newFields = { ...prev };
        const { blocKey, index: blocIndex, fieldKey, fieldIndex } = parsed;

        if (fieldIndex != null) {
          // Champ duplicable
          const groupId = getGroupId(parsed);

          if (!newFields.groups[groupId]) {
            newFields.groups[groupId] = {
              blocKey,
              blocIndex,
              fieldKey,
              fields: [],
            };
          }

          // Ajouter avec un order basé sur l'index ou la longueur actuelle
          newFields.groups[groupId].fields.push({ key: newFieldKey, order: nextOrder });

          newFields.groups[groupId].fields.sort((a, b) => a.order - b.order);
        } else {
          // Champ simple
          newFields.singles.push(newFieldKey);
        }
        return newFields;
      });
    }
  };

  const handleFieldOrderChange = (newFields: FieldKeyWithOrder[]) => {
    console.log("Changement d'ordre:", newFields);

    fields.updateFieldsOrder(newFields);

    setLocalFields((prev) => {
      const updated = { ...prev };

      // Trouver le groupe concerné
      const keyToOrder = Object.fromEntries(
        newFields.map((f) => [f.key, f.order]),
      );

      Object.keys(updated.groups).forEach((groupId) => {
        const group = updated.groups[groupId];
        const updatedFields = group.fields.map((field) => ({
          ...field,
          order: keyToOrder[field.key] ?? field.order,
        }));

        // Trier par le nouvel ordre
        updatedFields.sort((a, b) => a.order - b.order);

        updated.groups[groupId] = {
          ...group,
          fields: updatedFields,
        };
      });

      return updated;
    });
  };

  function groupFields(
    keys: string[],
    fieldOrders: Record<string, number>,
  ): LocalFields {
    const localFields: LocalFields = { singles: [], groups: {} };

    keys.forEach((key) => {
      const parsed = parseBlocFullKey(key);
      if (!parsed) return;

      const { blocKey, index: blocIndex, fieldKey, fieldIndex } = parsed;

      if (fieldIndex == null) {
        // champ simple, on garde juste la clé
        localFields.singles.push(key);
      } else {
        // champ duplicable
        const order = fieldOrders[key] ?? fieldIndex;
        const groupId = `${blocKey}-${blocIndex}-${fieldKey}`;
        if (!localFields.groups[groupId]) {
          localFields.groups[groupId] = {
            blocKey,
            blocIndex,
            fieldKey,
            fields: [],
          };
        }
        localFields.groups[groupId].fields.push({ key, order });
      }
    });

    // tri interne des groupes
    Object.values(localFields.groups).forEach((group) => {
      group.fields.sort((a, b) => a.order - b.order);
    });

    return localFields;
  }

  return (
    <div className={`bloc-instance ${blocHasError ? 'has-error' : ''}`}>
      <CollapsibleBloc
        header={
          <div className="bloc-item-header" {...dragHandleProps}>
            <h4>
              {blocRule.itemLabel}{' '}
              {getBlocIndice(bloc.index, bloc.current.order)}
            </h4>
            <div className="drag-zone" {...dragHandleProps}>
              <GripHorizontal className="drag-grip"></GripHorizontal>
              {/* Message d'erreur visible seulement sur desktop */}
              {blocHasError && (
                <div className="text-info error-msg">
                  <AlertTriangle className="input-error-icon" />
                  <p>Ce bloc a des champs en erreur</p>
                </div>
              )}
            </div>
            {blocRule.isDuplicable && (
              <button
                data-no-drag
                disabled={!allowRemove}
                onClick={() => onRemove(index)}
              >
                <p>Supprimer</p> <X />
              </button>
            )}
            {/* Message d'erreur séparé pour mobile */}
            {blocHasError && (
              <div
                className="text-info error-msg error-msg-mobile"
                {...dragHandleProps}
              >
                <AlertTriangle className="input-error-icon" />
                <p>Ce bloc a des champs en erreur</p>
              </div>
            )}
          </div>
        }
        forceCollapsed={isReordering}
      >
        <div className="bloc-content">
          {/* Items non groupés */}
          {localFields.singles.map((key) => {
            const parsed = parseBlocFullKey(key);
            if (!parsed) return null;

            const fieldKey = parsed.fieldKey;
            const textRule = blocRule.textFields?.[fieldKey!];
            const imageRule = blocRule.imageFields?.[fieldKey!];

            if (textRule) {
              return (
                <SmartTextUploader
                  key={key}
                  textKey={key}
                  textRules={textRule}
                />
              );
            }
            if (imageRule) {
              return (
                <SmartImageUploader
                  key={key}
                  imageKey={key}
                  imageRule={imageRule}
                />
              );
            }
            return null;
          })}

          {/* Items groupés dans des ReorderableList */}
          {Object.entries(localFields.groups).map(([groupId, group]) => {
            const { fieldKey } = group;
            const textRule = blocRule.textFields?.[fieldKey!];
            const imageRule = blocRule.imageFields?.[fieldKey!];
            const canReorder = group.fields.length > 1;

            return (
              <ReorderableList
                key={groupId}
                fieldKeys={group.fields.map((field) => {
                  const parsed = parseBlocFullKey(field.key);
                  return {
                    key: field.key,
                    order: field.order,
                    blocKey: parsed?.blocKey || '',
                    index: parsed?.index || 0,
                    fieldIndex: parsed?.fieldIndex || 0,
                  };
                })}
                className="bloc-duplicable-group"
                disableDrag={!canReorder}
                onOrderChange={handleFieldOrderChange}
              >
                {(id, dragItemHandleProps) => {                  
                  const field = group.fields.find((f) => f.key === id);
                  if (!field) return null;

                  const parsed = parseBlocFullKey(field.key);
                  if (!parsed) return null;

                  const actualFieldIndex = parsed.fieldIndex;
                  const activeFields = countByKey.get(field.key) || 0

                  if (textRule) {
                    const canRemoveField =
                      activeFields > (textRule.minItems ?? 0);
                    const canAddField =
                      activeFields < (textRule.maxItems ?? Infinity);

                    return (
                      <SmartTextUploader
                        key={field.key}
                        textKey={field.key}
                        textRules={textRule}
                        fieldIndex={actualFieldIndex}
                        canRemove={canRemoveField}
                        canAdd={canAddField}
                        canReorder={canReorder}
                        onRemoveField={handleRemoveField}
                        onCreateField={handleCreateField}
                        dragItemHandleProps={dragItemHandleProps}
                      />
                    );
                  }

                  if (imageRule) {
                    const canRemoveField =
                      activeFields > (imageRule.minItems ?? 0);
                    const canAddField =
                      activeFields < (imageRule.maxItems ?? Infinity);

                    return (
                      <SmartImageUploader
                        key={field.key}
                        imageKey={field.key}
                        imageRule={imageRule}
                        fieldIndex={actualFieldIndex}
                        canRemove={canRemoveField}
                        canAdd={canAddField}
                        canReorder={canReorder}
                        onRemoveField={handleRemoveField}
                        onCreateField={handleCreateField}
                        dragItemHandleProps={dragItemHandleProps}
                      />
                    );
                  }

                  return null;
                }}
              </ReorderableList>
            );
          })}
        </div>
      </CollapsibleBloc>
    </div>
  );
};
