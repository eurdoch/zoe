import { createContext, useContext, useState, ReactNode } from 'react';

type ModalContextType = {
  modalVisible: boolean;
  modalContent: ReactNode | null;
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType>({
  modalVisible: false,
  modalContent: null,
  showModal: () => {}, // Empty function as placeholder
  hideModal: () => {}, // Empty function as placeholder
});

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const showModal = (content: ReactNode) => {
    setModalContent(content);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setModalContent(null);
  };

  return (
    <ModalContext.Provider value={{ modalVisible, modalContent, showModal, hideModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
