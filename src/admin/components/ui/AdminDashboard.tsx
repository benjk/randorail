import './adminBoard.scss';
import { useEffect, useRef, useState } from 'react';
import { AdminGlobals } from './AdminGlobals';
import { AdminPage } from './AdminPage';
import { AdminDrawer } from '../nav/AdminDrawer';
import { AdminToolbar } from './AdminToolbar';
import { useConfirm } from '../modal/ConfirmModalContext';
import { useExitGuard } from '../modal/useExitGuard';
import { useAdminStatic } from '../publish/useAdminStatic';
import { useAdminData } from '../publish/useAdminData';
import { AdminContact } from './AdminContact';
import { useAdminPageNavigation } from '../nav/useAdminPageNav';
import { throttle } from '../nav/navUtils';

export function AdminDashboard() {
  const { uiHooks } = useAdminData();
  const { editablePages } = useAdminStatic();
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  const { currentPage, setCurrentPage, scrollPositions, saveScroll } =
    useAdminPageNavigation();

  const confirm = useConfirm();
  const changed = uiHooks.useHasChanges();
  useExitGuard({ hasChanges: changed, confirm });

  const drawerWidth = getComputedStyle(document.documentElement)
    .getPropertyValue('--drawer-width')
    .trim();

  const containerRef = useRef<HTMLDivElement>(null);
  const pageInstancesRef = useRef(new Map<string, React.ReactNode>());
  // Ajouter une page si elle n’est pas encore dans le cache 
  if (!pageInstancesRef.current.has(currentPage)) {
    const currentPageInfo = editablePages.find((p) => p.key === currentPage);
    const title = currentPageInfo?.label || currentPage;

    let component: React.ReactNode;
    if (currentPage === 'globals') {
      component = <AdminGlobals />;
    } else if (currentPage === 'contact-globals') {
      component = <AdminContact />;
    } else {
      component = <AdminPage pageKey={currentPage} pageTitle={title} />;
    }
    pageInstancesRef.current.set(currentPage, component);
  }

  // restore scroll when changing page
  useEffect(() => {
    const y = scrollPositions[currentPage] ?? 0;
    const el = containerRef.current;
    if (el) el.scrollTop = y;
  }, [currentPage]);

  // throttle scroll saving
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // save scroll every 0.5s only for perf
    const handleScroll = throttle(() => {
      saveScroll(currentPage, el.scrollTop);
    }, 500);

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [currentPage, saveScroll]);

  return (
    <div className="admin-dashboard-layout">
      <AdminDrawer
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        editablePages={editablePages}
        isCollapsed={isDrawerCollapsed}
        setIsCollapsed={setIsDrawerCollapsed}
      />
      <div
        className="admin-content"
        ref={containerRef}
        style={{
          marginLeft: isDrawerCollapsed ? `-${drawerWidth}` : '0px',
        }}
      >
        <div className="admin-page-container">
          {[...pageInstancesRef.current.entries()].map(([key, component]) => (
            <div
              className="admin-page-renderer"
              key={key}
              style={{
                display: key === currentPage ? 'block' : 'none',
              }}
            >
              {component}
            </div>
          ))}
        </div>
        <AdminToolbar />
      </div>
    </div>
  );
}
