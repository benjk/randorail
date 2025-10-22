import { useState, ReactNode, KeyboardEvent, useEffect } from 'react';
import { useCollapsibleAnimation } from './useCollapsibleAnimation';
import './collapsibleSection.scss'; // Même styles
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleBlocProps {
  header: ReactNode;
  forceCollapsed: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}
export const CollapsibleBloc = ({
  header,
  forceCollapsed = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  children,
}: CollapsibleBlocProps) => {
  const [collapsed, setCollapsed] = useState(forceCollapsed);
  const { contentRef, isTransitioning } = useCollapsibleAnimation(!collapsed);

  // Sync quand prop change
  useEffect(() => {
    setCollapsed(forceCollapsed);
  }, [forceCollapsed]);

  const toggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
  };

  return (
    <div
      className={`collapsible collapsible-bloc ${className} ${!collapsed ? 'is-open' : 'is-closed'}`}
      data-transitioning={isTransitioning}
    >
      <div className={`collapsible__bloc-header ${headerClassName}`}>
        <button
          type="button"
          className="collapsible__toggle-btn"
          onClick={toggle}
          aria-label={collapsed ? 'Ouvrir' : 'Fermer'}
        >
          <span className="collapsible__icon-bloc" aria-hidden="true">
            <ChevronDown></ChevronDown>
          </span>
        </button>
        <div className="collapsible__header-content">{header}</div>
      </div>

      <div
        ref={contentRef}
        className={`collapsible__content ${contentClassName}`}
        aria-hidden={collapsed}
      >
        <div className="collapsible__inner">{children}</div>
      </div>
    </div>
  );
};
