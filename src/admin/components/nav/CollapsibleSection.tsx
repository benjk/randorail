import { useState, ReactNode, KeyboardEvent } from 'react';
import { useCollapsibleAnimation } from './useCollapsibleAnimation';
import './collapsibleSection.scss';
import { ChevronDown, ListOrderedIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  isDynamicBloc?: boolean;
  onReorderClick?: () => void;
}

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
  onToggle,
  className = '',
  headerClassName = '',
  contentClassName = '',
  disabled = false,
  isDynamicBloc = false,
  onReorderClick,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { contentRef, isTransitioning } = useCollapsibleAnimation(isOpen);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const handleToggle = () => {
    if (disabled || isTransitioning) return;

    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  const handleReorderClick = () => {
    setIsReorderMode((v) => !v);
    onReorderClick?.();
  };

  return (
    <div
      className={`collapsible ${className} ${isOpen ? 'is-open' : 'is-closed'}`}
      data-transitioning={isTransitioning}
    >
      <div className={`collapsible__header ${headerClassName}`}>
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-controls="collapsible-content"
        >
          <span className="collapsible__icon" aria-hidden="true"  onClick={handleToggle}>
            <ChevronDown></ChevronDown>
          </span>
          <span className="collapsible__title">{title}</span>
        </button>
        {isDynamicBloc && (
          <ListOrderedIcon
            className={`order-icon ${isReorderMode ? 'is-active' : ''}`}
            onClick={handleReorderClick}
          ></ListOrderedIcon>
        )}
      </div>

      <div
        id="collapsible-content"
        ref={contentRef}
        className={`collapsible__content ${contentClassName}`}
        aria-hidden={!isOpen}
      >
        <div className="collapsible__inner">{children}</div>
      </div>
    </div>
  );
};
