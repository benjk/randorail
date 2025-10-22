import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from "react";
import { ServerMessage, ServerMessageType } from "./publish.type";
import { useDeploymentStatus } from "./useDeploymentData";
import { DeploymentState } from "./publish.type";
import { serverMessages } from "./messages";

/** Contexte pour gérer l'état de publication et les messages du serveur */
const AdminStatusContext = createContext<{
  isPublishing: boolean;
  setIsPublishing: (v: boolean) => void;
  serverMessage: ServerMessage | null;
  setServerMessage: (msg: ServerMessage | null) => void;
  pushServerMessage: (
    text: string,
    type?: ServerMessageType | undefined
  ) => void;
}>(null!);

export const AdminStatusProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [serverMessage, setServerMessage] = useState<ServerMessage | null>(
    null
  );

  const { status, isOwnDeployment, error } = useDeploymentStatus();

  // Permet de mettre à jour le message en ajoutant un texte d'étape
  const pushServerMessage = (text: string, type = ServerMessageType.Info) => {
    if (type == ServerMessageType.Error) {
      setIsPublishing(false);
    }
    setServerMessage({ type, text });
  };

  // Écoute de l’évolution du déploiement
  useEffect(() => {
    if (!isOwnDeployment) return;

    if (status === DeploymentState.Deployed) {
      setServerMessage({
        type: ServerMessageType.Success,
        text: serverMessages.publishSuccess,
      });
      setIsPublishing(false);
    }

    if (status === DeploymentState.Error) {
      setServerMessage({
        type: ServerMessageType.Error,
        text: `Erreur pendant le déploiement.`,
      });
      setIsPublishing(false);
    }
  }, [status, isOwnDeployment, error]);

  const contextValue = useMemo(
    () => ({
      isPublishing,
      setIsPublishing,
      serverMessage,
      setServerMessage,
      pushServerMessage,
    }),
    [isPublishing, serverMessage]
  );

  return (
    <AdminStatusContext.Provider value={contextValue}>
      {children}
    </AdminStatusContext.Provider>
  );
};

export const useAdminStatus = () => useContext(AdminStatusContext);
export const useIsPublishingOnly = () => useAdminStatus().isPublishing;
