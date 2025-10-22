import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from "react";
import pagesMeta from "../../../data/pagesMeta.json";

/** Contexte pour fournir les pages éditables et la gestion du chargement */
const AdminStaticContext = createContext<{
  editablePages: { key: string; title: string }[];
  isLoaded: boolean;
}>({
  editablePages: [],
  isLoaded: false,
});

export const AdminStaticProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const editablePages = useMemo(() => {
    return Object.entries(pagesMeta || {})
      .filter(([, value]) => value.editable !== false)
      .map(([key, value]) => ({ key, title: value.label || key }));
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