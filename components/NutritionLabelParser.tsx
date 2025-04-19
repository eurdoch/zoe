import {useEffect, useRef, useState} from "react";
import {StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator} from "react-native";
import {Camera, useCameraDevices} from "react-native-vision-camera";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getNutritionLabelImgInfo } from "../network/nutrition";
import { showToastError } from "../utils";
import CustomModal from "../CustomModal";
import { useFoodData } from "../contexts/FoodDataContext";

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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Use the food data context
  const { setNutritionInfo } = useFoodData();

  useEffect(() => {
    if (!cameraActive) {
      navigation.navigate('Diet');
    }
  }, [cameraActive]);

  // Permission is now handled in DietScreen before navigating here
  useEffect(() => {
    setHasPermission(true);
  }, []);

  const takePhoto = async () => {
    try {
      setCaptureDisabled(true);
      setIsProcessing(true);
      
      // Take photo
      const photo = await camera.current?.takePhoto();
      
      if (!photo) {
        throw new Error("Failed to take photo");
      }
      
      // Process photo - convert to base64
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();
      
      // Convert blob to base64 string
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      
      // Extract the raw base64 data (remove data:image/jpeg;base64, prefix)
      const rawImageString = base64Data.slice(base64Data.indexOf(',') + 1);
      
      // Process with API
      const nutritionData = await getNutritionLabelImgInfo(rawImageString);
      
      // Log results to console
      console.log("===== Nutrition Label Parsing Results =====");
      console.log(JSON.stringify(nutritionData, null, 2));
      
      // Set the nutrition data in global context
      setNutritionInfo(nutritionData);
      
      // Navigate back to Diet screen
      navigation.pop();
      
      setCaptureDisabled(false);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing nutrition label:", error);
      showToastError("Could not process nutrition label.");
      setCaptureDisabled(false);
      setIsProcessing(false);
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
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingText}>Processing nutrition label...</Text>
        </View>
      )}
      
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
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      {/* Modal no longer needed since we navigate directly */}
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 10,
    borderRadius: 10,
    position: 'absolute',
    top: 40,
    right: 20,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  processingOverlay: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  nutritionInfoContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

