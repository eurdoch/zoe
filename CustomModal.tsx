
import React from 'react';
import { Modal, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
interface CustomModalProps {
  children: React.ReactNode;
  visible: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  setVisible: (visible: boolean) => void;
}
const CustomModal = ({ children, visible, setVisible, animationType = 'fade' }: CustomModalProps) => {
  const screenWidth = Dimensions.get('window').width;
  return (
    <Modal
      animationType={animationType}
      visible={visible}
      transparent={true}
      onRequestClose={() => setVisible(false)}
      onDismiss={() => setVisible(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setVisible(false)}>
        <View style={[styles.modalView, { maxWidth: screenWidth * 0.8 }]}>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
export default CustomModal;
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    flexDirection: 'column',
    gap: 10,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%'
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    borderRadius: 5,
    padding: 10,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
  },
});
