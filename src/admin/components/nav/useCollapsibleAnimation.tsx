import { useRef, useState, useEffect } from "react";

export const useCollapsibleAnimation = (isOpen: boolean, duration = 300) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsTransitioning(true);

    if (isOpen) {
      // Ouverture : hauteur auto après transition
      const scrollHeight = content.scrollHeight;
      content.style.height = `${scrollHeight}px`;
      
      timeoutRef.current = setTimeout(() => {
        if (content) {
          content.style.height = 'auto';
        }
        setIsTransitioning(false);
      }, duration);
    } else {
      // Fermeture : fixer la hauteur puis animer vers 0
      const currentHeight = content.scrollHeight;
      content.style.height = `${currentHeight}px`;
      
      // Force reflow
      content.offsetHeight;
      
      requestAnimationFrame(() => {
        if (content) {
          content.style.height = '0px';
        }
        timeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, duration);
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, duration]);

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    contentRef,
    isTransitioning
  };
};