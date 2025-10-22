import React, { useState } from 'react';
import './adminDrawer.scss';
import { signOut } from 'firebase/auth';
import { auth } from '../auth/firebaseClient';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { set } from 'astro:schema';

interface Page {
  key: string;
  label: string;
  group: string;
}

interface AdminDrawerProps {
  currentPage: string;
  setCurrentPage: (key: string) => void;
  editablePages: { key: string; title: string }[];
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

  const staticPages: Page[] = [
    { key: 'globals', label: 'Paramètres globaux', group: 'Général' },
    { key: 'contact', label: 'Contact', group: 'Général' },
  ];

  const dynamicPages: Page[] = editablePages.map(({ key, title }) => ({
    key,
    label: title,
    group: 'Pages',
  }));

  const allPages = [...staticPages, ...dynamicPages];

  const pagesByGroup = allPages.reduce<Record<string, Page[]>>((acc, page) => {
    const group = page.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(page);
    return acc;
  }, {});

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

  return (
    <>
      <div className={`admin-drawer ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          className="drawer-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ArrowRight></ArrowRight> : <ArrowLeft></ArrowLeft>}
        </button>

        {!isCollapsed && (
          <>
            <div className="admin-nav-content">
              <div className="admin-drawer-title">
                <h2>Administration</h2>
              </div>
              <nav className="admin-drawer-nav">
                {Object.entries(pagesByGroup).map(([group, groupPages]) => (
                  <div key={group} className="admin-drawer-group">
                    <h3 className="admin-drawer-group-title">{group}</h3>
                    <ul className="admin-drawer-menu">
                      {groupPages.map((page) => (
                        <li
                          key={page.key}
                          className={`admin-drawer-menu-item ${
                            currentPage === page.key ? 'active' : ''
                          }`}
                          onClick={() => setCurrentPage(page.key)}
                        >
                          {page.label}
                        </li>
                      ))}
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
            {Object.entries(pagesByGroup).map(([group, groupPages]) => (
              <div key={group} className="admin-drawer-group">
                <h3>{group}</h3>
                <ul>
                  {groupPages.map((page) => (
                    <li key={page.key}>
                      <a
                        className={currentPage === page.key ? 'active' : ''}
                        onClick={(e) => {
                          setCurrentPage(page.key);
                          closeMenu();
                          setIsBurgerOpen(false);
                        }}
                      >
                        {page.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
