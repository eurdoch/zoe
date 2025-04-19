import { useEffect, useRef, useState } from "react";
import { Camera, useCameraDevices, useCodeScanner } from "react-native-vision-camera";
import { getFoodItemByUpc } from "../network/nutrition";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { transformToProductResponse } from "../transform";
import NetworkError from "../errors/NetworkError";
import { showToastError } from "../utils";
import { useFoodData } from "../contexts/FoodDataContext";

interface BarcodeScannerProps {
  navigation: any;
}

const BarcodeScanner = ({ navigation }: BarcodeScannerProps) => {
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();
  const device = Object.values(devices).find(d => d.position === 'back');
  const { setScannedProduct, setNutritionInfo } = useFoodData();

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: async (codes) => {
      const upc = codes[0].value;
      if (upc) {
        setCameraActive(false);
        try {
          const item = await getFoodItemByUpc(upc);
          const productResponse = transformToProductResponse(item);
          
          // Log the product data to console
          console.log('Scanned product data:', productResponse);
          
          // Set the data in the global context
          setNutritionInfo(null);
          setScannedProduct(productResponse);
          
          // Navigate back to the Diet screen
          navigation.popTo('Diet');
        } catch(err: any) {
          if (err instanceof NetworkError) {
            showToastError("Product could not be found.");
            setCameraActive(false);
            // Navigate back to previous screen (DietScreen) on error
            navigation.popTo('Diet');
          }
        }
      }
    }
  });

  // Permission is now handled in DietScreen before navigating here
  useEffect(() => {
    setHasPermission(true);
  }, []);

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

  const closeCamera = () => {
    setCameraActive(true);
    navigation.navigate('Diet');
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive}
        photo={true}
        codeScanner={codeScanner}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={closeCamera}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default BarcodeScanner;

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
