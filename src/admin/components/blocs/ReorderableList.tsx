import React, { useEffect, useState } from 'react';
import './reorderableList.scss';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Move } from 'lucide-react';
import { FieldKeyWithOrder } from '../publish/publish.type';

type ReorderableListProps = {
  fieldKeys: FieldKeyWithOrder[];
  disableDrag: boolean;
  onOrderChange: (newOrder: FieldKeyWithOrder[]) => void;
  children: (id: string, dragHandleProps: any) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
};

// Composant pour chaque item draggable
interface SortableItemProps {
  id: string;
  children: (dragHandleProps: any) => React.ReactNode;
  disabled: boolean;
  className: string;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  disabled,
  className,
}) => {
  const sortable = useSortable({ id });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = disabled
    ? {
        attributes: {},
        listeners: {},
        setNodeRef: undefined,
        transform: null,
        transition: undefined,
        isDragging: false,
      }
    : sortable;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`reorderable-item ${className ?? ''}`}
    >
      {children(disabled ? {} : { ...attributes, ...listeners })}
    </div>
  );
};

export const ReorderableList: React.FC<ReorderableListProps> = ({
  fieldKeys,
  disableDrag = false,
  onOrderChange,
  children,
  className = 'reorderable-list',
  itemClassName,
  wrapper: Wrapper,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensorsWithValidation = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Trier les items par order (fallback sur l'index dans le tableau si pas d'order)
  const sortedItems = [...fieldKeys].sort((a, b) => {
    const orderA = a.order ?? fieldKeys.indexOf(a);
    const orderB = b.order ?? fieldKeys.indexOf(b);
    return orderA - orderB;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    console.log("MES ITEMS SORTED :", sortedItems);
    

    const oldIndex = sortedItems.findIndex((item) => item.key === active.id);
    const newIndex = sortedItems.findIndex((item) => item.key === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedItems, oldIndex, newIndex);

      const changedItems: FieldKeyWithOrder[] = [];

      newOrder.forEach((item, index) => {
        const expectedOrder = index + 1;
        const originalOrder = item.order ?? sortedItems.indexOf(item) + 1;
        if (originalOrder !== expectedOrder) {
          changedItems.push({
            key: item.key,
            order: expectedOrder,
            blocKey: item.blocKey,
            index: item.index,
          });
        }
      });

      if (changedItems.length > 0) {
        onOrderChange(changedItems);
      }
    }
  };

  const toggleBodyGrabbingCursor = (isDragging: boolean) => {
    if (isDragging) {
      document.body.classList.add('grabbing');
    } else {
      document.body.classList.remove('grabbing');
    }
  };

  const content = (
    <DndContext
      sensors={sensorsWithValidation}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        if (disableDrag) return;
        setActiveId(active.id as string);
        toggleBodyGrabbingCursor(true);
      }}
      onDragEnd={(event) => {
        toggleBodyGrabbingCursor(false);
        setActiveId(null);
        handleDragEnd(event);
      }}
      onDragCancel={() => {
        toggleBodyGrabbingCursor(false);
        setActiveId(null);
      }}
    >
      <SortableContext
        items={sortedItems.map((item) => item.key)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className + (disableDrag ? ' ' : ' active')}>
          {sortedItems.map((item) => (
            <SortableItem
              key={`sortitem-${item.key}`}
              id={item.key}
              disabled={disableDrag}
              className={itemClassName || ''}
            >
              {(dragHandleProps) => children(item.key, dragHandleProps)}
            </SortableItem>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId && (
            <div
              className={`drag-placeholder`}
              style={{ position: 'absolute' }}
            >
              {' '}
              <Move></Move>
            </div>
          )}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );

  return Wrapper ? <Wrapper>{content}</Wrapper> : content;
};
