import { RefObject, useEffect, useRef } from "react";

export const useTextareaAutoResize = (  textareaRef: React.RefObject<HTMLTextAreaElement | null>, value: string) => {
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!textareaRef) return;
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Utiliser un délai pour éviter de recalculer la hauteur à chaque frappe
    debounceTimeout.current = window.setTimeout(() => {
      const adjustHeight = (textarea: HTMLTextAreaElement | null) => {
        if (textarea) {
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      };

      adjustHeight(textareaRef.current);
    }, 100); // Délai de 100ms

    // Nettoyer le timeout lorsque le composant est démonté ou que la valeur change
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [value, textareaRef]);
};
