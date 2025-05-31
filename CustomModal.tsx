import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated, 
  Keyboard, 
  Platform 
} from 'react-native';

interface CustomModalProps {
  children: React.ReactNode;
  visible: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  onOverlayPress?: () => void;
}

const CustomModal = ({ children, visible, setVisible, animationType = 'fade', onOverlayPress }: CustomModalProps) => {
  const screenWidth = Dimensions.get('window').width;
  const [modalPosition] = useState(new Animated.Value(0));

  // Handle keyboard showing/hiding
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // When keyboard shows, animate modal to move up above keyboard
        Animated.timing(modalPosition, {
          toValue: -e.endCoordinates.height / 2,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // When keyboard hides, animate modal back to original position
        Animated.timing(modalPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [modalPosition]);
  return (
    <Modal
      animationType={animationType}
      visible={visible}
      transparent={true}
      onRequestClose={() => setVisible(false)}
      onDismiss={() => setVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        onPress={() => {
          setVisible(false);
          onOverlayPress?.();
        }}
        activeOpacity={1}
      >
        <Animated.View 
          style={[
            styles.modalView, 
            { 
              maxWidth: screenWidth * 0.8,
              transform: [{ translateY: modalPosition }]
            }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%' }}
          >
            {children}
          </TouchableOpacity>
        </Animated.View>
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
