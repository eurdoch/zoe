import {useEffect, useRef, useState} from "react";
import {StyleSheet, Text, View, TouchableOpacity, Dimensions} from "react-native";
import {Camera, useCameraDevices} from "react-native-vision-camera";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CustomModal from "../CustomModal";

interface NavigationProps {
  navigation: NativeStackNavigationProp<any, any>;
}

const NutritionLabelParser = ({ navigation }: NavigationProps) => {
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const camera = useRef<Camera | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = Object.values(devices).find(d => d.position === 'back');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [captureDisabled, setCaptureDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (!cameraActive) {
      navigation.goBack();
    }
  }, [cameraActive]);

  useEffect(() => {
    const checkPermission = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
    };
    checkPermission();
  }, []);

  const takePhoto = async () => {
    try {
      setCaptureDisabled(true);
      const photo = await camera.current?.takePhoto();
      navigation.navigate(
        'DietLog',
        { photo }
      );
      setCaptureDisabled(false);
    } catch (error) {
      console.error(error);
      setCaptureDisabled(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.textContainer]}>
        <Text style={styles.text}>No camera permission</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.textContainer]}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive}
        photo={true}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, captureDisabled ? styles.disabledCaptureButton : styles.captureButton]}
          onPress={takePhoto}
          disabled={captureDisabled}
        >
          <Text style={styles.buttonText}>Capture</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.cancelButton} onPress={() => setCameraActive(false)}>
      </TouchableOpacity>
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        <Text>hello</Text>
      </CustomModal>
    </View>
  )
}

export default NutritionLabelParser;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 30,
    minWidth: 80,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'white',
  },
  disabledCaptureButton: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 10,
    borderRadius: 10,
    position: 'absolute',
    top: 40,
    right: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  activityIndicator: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

