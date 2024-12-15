import {useEffect, useRef, useState} from "react";
import {StyleSheet, Text, View, TouchableOpacity} from "react-native";
import {Camera, useCameraDevices} from "react-native-vision-camera";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CustomModal from "../CustomModal";
import {getNutritionLabelImgInfo} from "../network/nutrition";

interface NavigationProps {
  navigation: NativeStackNavigationProp<any, any>;
}

const getBase64SizeInMB = (base64String: string): number => {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64WithoutPrefix = base64String.replace(/^data:.+;base64,/, '');
  
  // Calculate size in bytes
  const sizeInBytes = Math.ceil(base64WithoutPrefix.length * 0.75);
  
  // Convert to MB (divide by 1024 twice)
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Round to 2 decimal places
  return Number(sizeInMB.toFixed(2));
};

const NutritionLabelParser = ({ navigation }: NavigationProps) => {
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = Object.values(devices).find(d => d.position === 'back');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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
      const photo = await camera.current.takePhoto();
      const result = await fetch(`file://${photo.path}`);
      const data = await result.blob();
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(data);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
      const stringData = base64Data as string;
      const rawImageString = stringData.slice(23);
      const nutritionData = await getNutritionLabelImgInfo(rawImageString);
      console.log(nutritionData);
    } catch (error) {
      console.error(error);
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
        <TouchableOpacity style={[styles.button, styles.captureButton]} onPress={takePhoto}>
          <Text style={styles.buttonText}>Capture</Text>
        </TouchableOpacity>
      </View>
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        <Text>placeholder</Text>
      </CustomModal>
    </View>
  )
}

export default NutritionLabelParser;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 10,
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
});

