import { useEffect, useRef } from "react";

interface UseExitGuardProps {
  hasChanges: boolean;
  confirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmLabel?: string,
    cancelLabel?: string
  ) => void;
  message?: string;
}

export function useExitGuard({
  hasChanges,
  confirm,
  message = "Les modifications n'ont pas été publiées.\nVoulez-vous vraiment quitter cette page ?",
}: UseExitGuardProps) {
  const isInternalNavigation = useRef(false);

  // Labels centralisés
  const CONFIRM_LABEL = "Quitter";
  const CANCEL_LABEL = "Annuler";

  // 1. Protection fermeture d'onglet / reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // 2. Protection navigation interne via bouton "précédent"
  useEffect(() => {
    if (!hasChanges) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (!isInternalNavigation.current) {
        confirm(
          message,
          () => {
            isInternalNavigation.current = true;
            window.history.back();
          },
          () => {
            window.history.pushState(null, "", window.location.href);
          },
          CONFIRM_LABEL,
          CANCEL_LABEL
        );
      } else {
        isInternalNavigation.current = false;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasChanges, confirm, message]);

  // 3. Protection clics sur liens internes
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      if (!hasChanges) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.includes("#") && !link.target) {
        e.preventDefault();
        confirm(
          message,
          () => {
            isInternalNavigation.current = true;
            window.location.href = link.href;
          },
          undefined,
          CONFIRM_LABEL,
          CANCEL_LABEL
        );
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [hasChanges, confirm, message]);

  // 4. Protection raccourcis clavier (Alt+←)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasChanges) return;

      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        confirm(
          message,
          () => {
            isInternalNavigation.current = true;
            window.history.back();
          },
          undefined,
          CONFIRM_LABEL,
          CANCEL_LABEL
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, confirm, message]);

  // 5. API impérative
  const guardedNavigate = (action: string | (() => void)) => {
    if (hasChanges) {
      confirm(
        message,
        () => {
          isInternalNavigation.current = true;
          if (typeof action === "string") {
            window.location.href = action;
          } else {
            action();
          }
        },
        undefined,
        CONFIRM_LABEL,
        CANCEL_LABEL
      );
    } else {
      if (typeof action === "string") {
        window.location.href = action;
      } else {
        action();
      }
    }
  };

  return { guardedNavigate };
}
