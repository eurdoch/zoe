import React from 'react';
import { Modal, View, Button, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useModal } from './ModalContext';

function GlobalModal() {
  const { modalVisible, hideModal, modalContent } = useModal();

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={hideModal}
    >
      <TouchableWithoutFeedback onPress={hideModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalContent}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default GlobalModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
  },
});
