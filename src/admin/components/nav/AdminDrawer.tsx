import React, { useState } from 'react';
import './adminDrawer.scss';
import { signOut } from 'firebase/auth';
import { auth } from '../auth/firebaseClient';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { AdminMenuNode } from '../publish/admin-type';

interface Page {
  key: string;
  label: string;
  group: string;
}

interface AdminDrawerProps {
  currentPage: string;
  setCurrentPage: (key: string) => void;
  editablePages: AdminMenuNode[];
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  currentPage,
  setCurrentPage,
  editablePages,
  isCollapsed = false,
  setIsCollapsed,
}) => {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Mobile MENU
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false); // <-- NOUVEAU
  const [closing, setClosing] = useState(false);

  // Gestion des parents et enfants dans le menu
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(),
  );

  const toggleParent = (key: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const staticPages: Page[] = [
    { key: 'globals', label: 'Paramètres globaux', group: 'Général' },
    { key: 'contact-globals', label: 'Contact', group: 'Général' },
  ];

  const dynamicPages: Page[] = editablePages.map(({ key, label }) => ({
    key,
    label,
    group: 'Pages',
  }));

  const allPages = [...staticPages, ...dynamicPages];

  const pagesByGroup = allPages.reduce<Record<string, Page[]>>((acc, page) => {
    const group = page.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(page);
    return acc;
  }, {});

  const renderMenuItem = (node: AdminMenuNode, level: number = 0.2) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedParents.has(node.key);
    const isActive = currentPage === node.key;

    const handleClick = () => {
      if (hasChildren) {
        toggleParent(node.key);
      } else {
        setCurrentPage(node.key);
        if (isMobileMenuOpen) {
          closeMenu();
          setIsBurgerOpen(false);
        }
      }
    };

    return (
      <React.Fragment key={node.key}>
        <li
          className={`admin-drawer-menu-item ${isActive ? 'active' : ''} ${
            hasChildren ? 'has-children' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5}rem` }}
          onClick={handleClick}
        >
          <span>{node.label}</span>
          {hasChildren && (
            <span
              className={`chevron-toggle ${isExpanded ? 'expanded' : ''}`}
              aria-label={isExpanded ? 'Réduire' : 'Développer'}
            >
              <ChevronRight className="chevron-span" size={16} />
            </span>
          )}
        </li>

        {hasChildren && isExpanded && (
          <>{node.children!.map((child) => renderMenuItem(child, level + 1))}</>
        )}
      </React.Fragment>
    );
  };

  React.useEffect(() => {
    let touchStartY = 0;
    let touchStartX = 0;
    let touchEndY = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY = e.touches[0].clientY;
      touchEndX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const deltaY = touchStartY - touchEndY;
      const deltaX = Math.abs(touchStartX - touchEndX);

      // Swipe vertical vers le haut, sans mouvement latéral
      if (isMobileMenuOpen && deltaY > 50 && deltaX < 30) {
        closeMenu();
        setIsBurgerOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error('Erreur lors de la déconnexion :', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // MOBILE FUNCTIONS
  const toggleMenu = () => {
    if (isMobileMenuOpen) {
      setIsBurgerOpen(false);
      setClosing(true);
      setTimeout(() => {
        setIsMobileMenuOpen(false);
        setClosing(false);
      }, 300);
    } else {
      setIsBurgerOpen(true);
      setIsMobileMenuOpen(true);
    }
  };

  const closeMenu = () => {
    setClosing(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setClosing(false);
    }, 300);
  };

  const menuGroups = [
    {
      title: 'Général',
      items: staticPages.map((p) => ({ key: p.key, label: p.label })),
    },
    {
      title: 'Pages',
      items: editablePages, // Déjà la bonne structure avec children
    },
  ];

  return (
    <>
      <div className={`admin-drawer ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed && (
          <>
            <div className="admin-nav-content">
              <div className="admin-drawer-title">
                <h2>Administration</h2>
              </div>
              <nav className="admin-drawer-nav">
                {menuGroups.map((group) => (
                  <div key={group.title} className="admin-drawer-group">
                    <h3 className="admin-drawer-group-title">{group.title}</h3>
                    <ul className="admin-drawer-menu">
                      {group.items.map((item) => renderMenuItem(item))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
            <div className="admin-drawer-footer">
              <a
                href="/"
                rel="noopener noreferrer"
                className="admin-footer-logo"
              >
                <img src="/img/static/header_logo.webp" alt="Accueil site" />
              </a>
              <button
                onClick={handleLogout}
                className={`admin-btn ${isLoggingOut ? 'loading' : ''}`}
                disabled={isLoggingOut}
              >
                <span className="btn-text">Déconnexion</span>
                <span className="loader" />
              </button>
            </div>
          </>
        )}
      </div>
      <button
        className={`drawer-toggle ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ArrowRight></ArrowRight> : <ArrowLeft></ArrowLeft>}
      </button>

      {/* VERSION MOBILE */}
      <div className="admin-header admin-header-mobile">
        <div className="navbar">
          <a className="logo-link" href="/">
            <img src="/img/static/header_logo.webp" alt="Accueil" />
          </a>

          <div className="admin-header-right">
            <button className="admin-btn logout-btn" onClick={handleLogout}>
              Déconnexion
            </button>

            <button
              className={`burger ${isBurgerOpen ? 'is-active' : ''}`}
              onClick={toggleMenu}
              aria-label="Ouvrir le menu"
            >
              <span className="burger-line" />
              <span className="burger-line" />
              <span className="burger-line" />
            </button>
          </div>

          <div
            className={`mobile-admin-menu animated ${
              isMobileMenuOpen ? 'is-active' : ''
            } ${closing ? 'closing' : ''}`}
          >
            {menuGroups.map((group) => (
              <div key={group.title} className="admin-drawer-group">
                <h3>{group.title}</h3>
                <ul className="admin-drawer-menu">
                  {group.items.map((item) => renderMenuItem(item))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
