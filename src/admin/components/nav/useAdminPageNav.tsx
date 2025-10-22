import { createContext, useContext, useState, ReactNode } from 'react';

type PageNavContextType = {
  currentPage: string;
  setCurrentPage: (p: string) => void;
  scrollPositions: Record<string, number>;
  saveScroll: (page: string, scroll: number) => void;
  getCurrentScroll: () => number;
};

const PageNavContext = createContext<PageNavContextType>({
  currentPage: 'globals',
  setCurrentPage: () => {},
  scrollPositions: {},
  saveScroll: () => {},
  getCurrentScroll: () => 0,
});

export const AdminPageNavigationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentPage, setCurrentPage] = useState('globals');
  const [scrollPositions, setScrollPositions] = useState<
    Record<string, number>
  >({});

  const saveScroll = (page: string, scroll: number) => {
    setScrollPositions((prev) => ({
      ...prev,
      [page]: scroll,
    }));
  };

  const getCurrentScroll = () => {
    return scrollPositions[currentPage] || 0;
  };

  return (
    <PageNavContext.Provider
      value={{ currentPage, setCurrentPage, scrollPositions, saveScroll, getCurrentScroll }}
    >
      {children}
    </PageNavContext.Provider>
  );
};

export const useAdminPageNavigation = () => useContext(PageNavContext);
