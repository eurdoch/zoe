import React, {useEffect, useRef, useState} from "react";
import {StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Linking} from "react-native";
import {Camera, useCameraDevices} from "react-native-vision-camera";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getFoodImageAnalysis } from "../network/nutrition";
import { showToastError, showToastInfo } from "../utils";
import { useFoodData } from "../contexts/FoodDataContext";

interface NavigationProps {
  navigation: NativeStackNavigationProp<any, any>;
}

const FoodImageAnalyzer = ({ navigation }: NavigationProps) => {
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const camera = useRef<Camera | null>(null);
  const devices = useCameraDevices();
  const device = Object.values(devices).find(d => d.position === 'back');
  const [captureDisabled, setCaptureDisabled] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Use the food data context
  const { images, setImages } = useFoodData();

  // Check and request camera permission when component loads
  useEffect(() => {
    const checkAndRequestPermission = async () => {
      try {
        const status = await Camera.getCameraPermissionStatus();
        console.log('FoodImageAnalyzer - Camera permission status:', status);
        
        if (status === 'granted') {
          setHasPermission(true);
        } else if (status === 'not-determined') {
          const newPermission = await Camera.requestCameraPermission();
          console.log('FoodImageAnalyzer - Requested camera permission result:', newPermission);
          setHasPermission(newPermission === 'granted');
          
          if (newPermission !== 'granted') {
            // If permission still not granted, go back
            navigation.popTo('Diet');
          }
        } else {
          // Permission denied or restricted - show alert and go back
          Alert.alert(
            "Camera Permission Required",
            "Camera access is required to analyze food images. Please enable camera permissions in your device settings.",
            [
              { text: "Cancel", onPress: () => navigation.popTo('Diet'), style: "cancel" },
              { text: "Open Settings", onPress: () => {
                Linking.openSettings();
                navigation.popTo('Diet');
              }}
            ]
          );
          setHasPermission(false);
        }
      } catch (error) {
        console.error('FoodImageAnalyzer - Error checking permission:', error);
        setHasPermission(false);
        navigation.popTo('Diet');
      }
    };
    checkAndRequestPermission();
  }, []);

  useEffect(() => {
    if (!cameraActive && !isProcessing) {
      navigation.popTo('Diet');
    }
  }, [cameraActive, isProcessing]);

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
      
      // Add image to images array in context
      const updatedImages = [...images, rawImageString];
      setImages(updatedImages);
      
      // Navigate back to Diet screen
      setCameraActive(false);
      setIsProcessing(false);
      
    } catch (error) {
      console.error("Error analyzing food image:", error);
      showToastError("Could not analyze food image.");
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
          <Text style={styles.processingText}>Analyzing food image...</Text>
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
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.pop()}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
    </KeyboardAvoidingView>
  )
}

export default FoodImageAnalyzer;

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
  instructionContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
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
  }
});
