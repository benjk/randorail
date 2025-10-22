import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BlocInstanceState,
  EditableField,
  EditableFieldOptions,
  FieldKeyWithOrder,
} from '../publish/publish.type';
import { useAdminData } from '../publish/useAdminData';
import { BlocInstance } from './BlocInstance';
import { parseBlocFullKey } from './blocHelper';
import { ReorderableList } from './ReorderableList';
import { CollapsibleSection } from '../nav/CollapsibleSection';
import { Plus } from 'lucide-react';

interface BlocGroupManagerProps {
  blocKey: string;
  blocLabel: string;
}

// Memoize le composant BlocInstance pour éviter les re-renders inutiles
const MemoizedBlocInstance = React.memo(
  BlocInstance,
  (prevProps, nextProps) => {
    // Compare uniquement les props qui comptent vraiment
    return (
      prevProps.bloc.index === nextProps.bloc.index &&
      prevProps.bloc.current.order === nextProps.bloc.current.order &&
      prevProps.allowRemove === nextProps.allowRemove &&
      prevProps.blocRule === nextProps.blocRule &&
      JSON.stringify(prevProps.dragHandleProps) ===
        JSON.stringify(nextProps.dragHandleProps) &&
      prevProps.isReordering === nextProps.isReordering &&
      prevProps.bloc.fieldKeys.length === nextProps.bloc.fieldKeys.length
    );
  },
);

export const BlocGroupManager: React.FC<BlocGroupManagerProps> = ({
  blocKey,
  blocLabel,
}) => {
  const { createNewField, getField } = useAdminData().fields;
  const { updateBlocOrders } = useAdminData().blocs;
  const { addBlocInstance, getBlocGroup, subscribeBlocs, deleteBloc } =
    useAdminData().blocs;
  const [blocs, setBlocs] = useState<BlocInstanceState[]>([]);
  const [initialBlocsReady, setInitialBlocsReady] = useState(false);
  // Track les bloc en erreur pour autoriser ou non la suppression
  const [errorIndexes, setErrorIndexes] = React.useState<number[]>([]);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const blocGroup = getBlocGroup(blocKey);
  const blocRule = blocGroup.rule;
  const maxItems = blocRule.maxItem || 50;
  const minItem = blocRule.minItem || 1;

  useEffect(() => {
    setBlocs([...Object.values(blocGroup?.blocInstances)]);
    setInitialBlocsReady(true);

    const unsubscribe = subscribeBlocs(blocKey, () => {
      console.log(`BlocGroupManager - Bloc group updated for key: ${blocKey}`);

      const updatedGroup = getBlocGroup(blocKey);
      setBlocs(Object.values(updatedGroup?.blocInstances ?? {}));
      console.log(updatedGroup);
    });

    return () => unsubscribe();
  }, [blocGroup]);

  useEffect(() => {
    console.log('BLOCGROUPMANAGER - Mes Blocs : ', blocs);
  }, [blocs]);

  // Au premier appel, attrape le premier champ pour enregistrer sa structure comme modèle de données
  const modelFieldMap = React.useMemo(() => {
    if (!initialBlocsReady) return {};
    const firstValidBloc = blocs.find((bloc) => bloc !== null);
    if (!firstValidBloc) return {};
    const firstBlocFieldKeys = firstValidBloc.fieldKeys;

    return firstBlocFieldKeys.reduce(
      (acc, key) => {
        const logicalKey = parseBlocFullKey(key)!.fieldKey;
        const field = getField(key);
        if (field) {
          acc[logicalKey] = field;
        }
        return acc;
      },
      {} as Record<string, EditableField>,
    );
  }, [initialBlocsReady]);

  const otherValidBlocs = useCallback(
    (indexToRemove: number): number => {
      const errorSet = new Set(errorIndexes);
      errorSet.delete(indexToRemove);

      const remainingValidCount = blocs.filter(
        (b) =>
          !b.isDeleted && b.index !== indexToRemove && !errorSet.has(b.index),
      ).length;

      return remainingValidCount;
    },
    [blocs, errorIndexes],
  );

  const addBloc = () => {
    // Trouver le prochain index disponible
    const existingIndexes = blocs.map((b) => b.index);
    const newIndex =
      existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 0;
    console.log(`Adding new bloc with index: ${newIndex}`);
    // Trouver le prochain ordre disponible
    const nextOrder = (() => {
      const orders = blocs
        .map((b) => b.current.order)
        .filter((v): v is number => typeof v === 'number' && v > 0);

      return orders.length > 0 ? Math.max(...orders) + 1 : 1;
    })();

    const fieldKeys: string[] = [];
    // Créer les nouveaux champs
    console.log('Model Field Map :', modelFieldMap);

    Object.entries(modelFieldMap).forEach(([fieldKey, modelField]) => {
      const fieldRule =
        blocRule.textFields?.[fieldKey] || blocRule.imageFields?.[fieldKey];
      const isDuplicable = fieldRule?.isDuplicable;
      const minItems = fieldRule?.minItems || 1;

      if (isDuplicable) {
        for (let i = 0; i < minItems; i++) {
          const dupKey = `${blocKey}.${fieldKey}.${newIndex}.${i}`;
          fieldKeys.push(dupKey);
          createNewField(dupKey, {
            dataType: modelField.dataType,
            label: `${modelField.label} ${i + 1}`,
            partOfBloc: true,
            isNew: true,
            blocKey,
            associatedRoute: modelField.associatedRoute,
            fieldIndex: i,
          });
        }
      } else {
        const fullKey = `${blocKey}.${fieldKey}.${newIndex}`;
        fieldKeys.push(fullKey);
        createNewField(fullKey, {
          dataType: modelField.dataType,
          label: modelField.label,
          partOfBloc: true,
          isNew: true,
          blocKey,
          associatedRoute: modelField.associatedRoute,
        });
      }
    });

    // Ajouter du nouveau bloc au contexte
    addBlocInstance(blocKey, newIndex, fieldKeys, nextOrder);
  };

  const removeBloc = (index: number) => {
    const blocToRemove = blocs.find((bloc) => bloc.index === index);
    console.log('REMOVER ZAT BLOC :', blocToRemove);

    if (!blocToRemove) return;

    deleteBloc(blocKey, index, blocToRemove.fieldKeys);
  };

  const handleBlocValidationChange = useCallback(
    (index: number, hasError: boolean) => {
      setErrorIndexes((prev) => {
        if (hasError) {
          if (prev.includes(index)) return prev;
          return [...prev, index];
        } else {
          return prev.filter((i) => i !== index);
        }
      });
    },
    [],
  );

  // Gestion du changement d'ordre
  const handleOrderChange = useCallback(
    (newOrderedKeys: FieldKeyWithOrder[]) => {
      console.log('newOrderedKeys initial');
      console.log(newOrderedKeys);
      updateBlocOrders(newOrderedKeys);
    },
    [updateBlocOrders],
  );

  // Memoize les fieldKeys pour ReorderableList
  const reorderableFieldKeys = useMemo(() => {
    return blocs.map((bloc) => ({
      key: `${bloc.blocKey}.${bloc.index}`,
      order: bloc.current.order!,
      blocKey: bloc.blocKey,
      index: bloc.index,
    }));
  }, [blocs]);

  const renderBlocInstance = useCallback(
    (blocId: string, dragHandleProps: any) => {
      const bloc = blocs.find((b) => `${b.blocKey}.${b.index}` === blocId);

      if (!bloc || bloc.isDeleted) return null;
      return (
        <MemoizedBlocInstance
          key={`${bloc.blocKey}.${bloc.index}`}
          blocRule={blocRule}
          bloc={bloc}
          onRemove={removeBloc}
          allowRemove={otherValidBlocs(bloc.index) >= minItem}
          onValidationChange={handleBlocValidationChange}
          dragHandleProps={dragHandleProps}
          isReordering={isReorderMode}
        />
      );
    },
    [
      blocs,
      blocRule,
      removeBloc,
      otherValidBlocs,
      minItem,
      handleBlocValidationChange,
    ],
  );

  return (
    <CollapsibleSection
      title={blocLabel}
      className="admin-field-group"
      headerClassName="field-title"
      isDynamicBloc={blocs.length > 1}
      onReorderClick={() => setIsReorderMode((v) => !v)}
      key={`section-${blocKey}`}
    >
      <ReorderableList
        fieldKeys={reorderableFieldKeys}
        disableDrag={!initialBlocsReady || blocs.length <= 1 || !isReorderMode}
        onOrderChange={handleOrderChange}
        className="bloc-group-manager"
        itemClassName="reorderable-bloc"
      >
        {renderBlocInstance}
      </ReorderableList>

      {blocRule.isDuplicable && (
        <button
          className="admin-btn"
          onClick={addBloc}
          disabled={blocs.filter((b) => !b.isDeleted).length >= maxItems}
        >
          <Plus size={18}></Plus>
          <span>Ajouter {blocRule.itemLabel}</span>
        </button>
      )}
    </CollapsibleSection>
  );
};
