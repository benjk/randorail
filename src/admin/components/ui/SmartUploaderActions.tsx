import React from 'react';
import { Search, Undo2, Plus, X, GripVertical } from 'lucide-react';

interface Props {
  onSearch?: () => void;
  onRollback?: () => void;
  hasChanged?: boolean;
  isDuplicable?: boolean;
  canRemove?: boolean;
  canAdd?: boolean;
  canReorder?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onReorder?: () => void;
  dragItemHandleProps?: React.HTMLAttributes<HTMLElement>;
}

export const SmartUploaderActions: React.FC<Props> = ({
  onSearch,
  onRollback,
  onAdd,
  onRemove,
  onReorder,
  hasChanged = false,
  isDuplicable = false,
  canRemove = true,
  canAdd = true,
  canReorder = true,
  dragItemHandleProps,
}) => {
  const iconSize = 12;
  return (
    <div className="uploader-controls">
      {!isDuplicable ? (
        <button
          className="loupe-btn"
          onClick={onSearch}
          title="Voir l’emplacement sur le site"
        >
          <Search className="admin-icon" size={iconSize} />
        </button>
      ) : (
        <>
          <button
            className="order-btn"
            onClick={onReorder}
            title="Déplacer"
            disabled={!canReorder}
            {...dragItemHandleProps}
          >
            <GripVertical className="admin-icon" size={iconSize} />
          </button>
          <button
            className="add-btn"
            onClick={onAdd}
            title="Dupliquer"
            disabled={!canAdd}
          >
            <Plus className="admin-icon" size={iconSize} />
          </button>
          <button
            className="remove-btn"
            onClick={onRemove}
            title="Supprimer"
            disabled={!canRemove}
          >
            <X className="admin-icon" size={iconSize} />
          </button>
        </>
      )}
      <button
        className="rollback-btn"
        onClick={onRollback}
        disabled={!hasChanged}
        title="Annuler"
      >
        <Undo2 className="admin-icon" size={iconSize} />
      </button>
    </div>
  );
};
