import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../auth/firebaseClient';
import { DeploymentState } from './publish.type';
import { useAdminData } from './useAdminData';

interface DeploymentStatus {
  status: DeploymentState;
  deployId?: string;
  error?: string;
  isOwnDeployment: boolean;
  startedAt?: number;
}

interface DeploymentContextValue extends DeploymentStatus {
  contentVersion: string | undefined;
  updateContentVersion: (newVersion: string) => void;
}


/** Contexte pour fournir l'état du déploiement
 * Permet de détecter les déploiements en cours, y compris ceux qui viennent de l'extérieur
 * Traite les succès ou erreur de déploiement en écoutant la collection "deployments/current" de Firebase
 */
const DeploymentContext = createContext<DeploymentContextValue>({
  status: DeploymentState.Idle,
  isOwnDeployment: false,
  contentVersion: undefined,
  updateContentVersion: () => {},
});

let localDeployIdRef: string | null = null;

export const markDeploymentAsMine = (id: string) => {
  localDeployIdRef = id;
};

export const DeploymentProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DeploymentStatus>({
    status: DeploymentState.Idle,
    isOwnDeployment: false,
  });
  const { updateDataAfterPublish } = useAdminData().publish;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contentVersion, setContentVersion] = useState<string | undefined>(undefined);

  const updateContentVersion = (newVersion: string) => {
    setContentVersion(newVersion);
  };

  useEffect(() => {
    const ref = doc(db, 'deployments', 'current');

    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (!data || !data.status) return;

      const isOwn = data.deployId === localDeployIdRef;
      const newStatus = data.status as DeploymentState;
      const startedAt =
        data.startedAt?.toMillis?.() || data.startedAt || undefined;

      // Clean up timeout si fin de déploiement
      if (
        isOwn &&
        (newStatus === DeploymentState.Deployed ||
          newStatus === DeploymentState.Error)
      ) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Si déploiement long => timeout pour fallback
      if (
        isOwn &&
        newStatus === DeploymentState.Pending &&
        !timeoutRef.current
      ) {
        timeoutRef.current = setTimeout(() => {
          console.warn('⏱️ Timeout de déploiement : fallback déclenché');
          setState((prev) => ({
            ...prev,
            status: DeploymentState.Error,
            error: 'Le déploiement a dépassé le temps limite (2 minute).',
          }));
        }, 120_000);
      }

      setState({
        status: newStatus,
        deployId: data.deployId,
        error: newStatus === DeploymentState.Error ? data.error : undefined,
        isOwnDeployment: isOwn,
        startedAt,
      });

      // Si c’est nous et que le déploiement est fini, on met à jour le state
      if (isOwn && newStatus === DeploymentState.Deployed) {
        updateDataAfterPublish();
      }
    });

    return () => unsub();
  }, []);

  return (
    <DeploymentContext.Provider
      value={{
        ...state,
        contentVersion,
        updateContentVersion,
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
};

export const useDeploymentStatus = () => {
  const ctx = useContext(DeploymentContext);

  const isExternalPending =
    ctx.status === DeploymentState.Pending && !ctx.isOwnDeployment;

  return {
    ...ctx,
    isExternalPending,
  };
};
