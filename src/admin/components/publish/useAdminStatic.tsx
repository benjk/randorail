import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import pagesMetaRaw from '../../../data/pagesMeta.json';
const pagesMeta = pagesMetaRaw as Record<string, PageMetaEntry>;
import { AdminMenuNode, PageMetaEntry } from './admin-type';

/** Contexte pour fournir les pages éditables et la gestion du chargement */
const AdminStaticContext = createContext<{
  editablePages: AdminMenuNode[];
  isLoaded: boolean;
}>({
  editablePages: [],
  isLoaded: false,
});

export const AdminStaticProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const editablePages = useMemo(() => {
    const entries = Object.entries(pagesMeta || {})
      .filter(([, value]) => value.editable !== false)
      .map(([key, value]) => ({
        key,
        label: value.label || key,
        parent: value.parent,
      }));

    // Séparer parents et enfants
    const roots: AdminMenuNode[] = [];
    const childrenByParent: Record<string, AdminMenuNode[]> = {};

    entries.forEach(({ key, label, parent }) => {      
      if (!parent) {
        // Page racine - on créé avec children vide pour l'instant
        roots.push({ key, label, children: undefined });
      } else {
        // Page enfant - pas de children
        if (!childrenByParent[parent]) {
          childrenByParent[parent] = [];
        }
        childrenByParent[parent].push({ key, label });
      }
    });

    // Attacher les enfants aux parents
    roots.forEach((root) => {
      if (childrenByParent[root.key]) {
        root.children = childrenByParent[root.key];
      }
    });    

    return roots;
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <AdminStaticContext.Provider value={{ editablePages, isLoaded }}>
      {children}
    </AdminStaticContext.Provider>
  );
};

export const useAdminStatic = () => useContext(AdminStaticContext);
