import { createContext, useContext, useState } from "react";
import { ModalConfirm } from "./ModalConfirm";

type ConfirmFn = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmLabel?: string,
  cancelLabel?: string
) => void;


const ConfirmContext = createContext<ConfirmFn>(() => {});

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modal, setModal] = useState<null | {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }>(null);

  const showConfirm: ConfirmFn = (
    message,
    onConfirm,
    onCancel,
    confirmLabel,
    cancelLabel
  ) => {
    setModal({ message, onConfirm, onCancel, confirmLabel, cancelLabel });
  };

  const cancel = () => setModal(null);

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}
      {modal && (
        <ModalConfirm
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          onConfirm={() => {
            modal.onConfirm();
            cancel();
          }}
          onCancel={cancel}
        />
      )}
    </ConfirmContext.Provider>
  );
};
