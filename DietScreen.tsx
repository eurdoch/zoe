import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Button, TextInput } from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
} from 'react-native-vision-camera';
import { getNutritionInfo, searchFoodNatural } from './nutrition';

const DietScreen = () => {
  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentFoodItem, setCurrentFoodItem] = useState<any>({});
  const [searchText, setSearchText] = useState('');

  const devices = useCameraDevices();
  const device = Object.values(devices).find(d => d.position === 'back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      setIsActive(false);
      const upc = codes[0].value;
      if (upc) {
        getNutritionInfo(upc).then(info => setCurrentFoodItem(info));
      }
    }
  });

  // Request camera permissions
  useEffect(() => {
    const checkPermission = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      
      setHasPermission(
        cameraPermission === 'granted'
      );
    };

    checkPermission();
  }, []);

  const handleSearch = async () => {
    const searchResult = await searchFoodNatural(searchText);
    console.log(searchResult);
  }

  // Handle no permissions
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera permission</Text>
      </View>
    );
  }

  // Handle no device
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  const handleCapture = (_e: any) => {
    setIsActive(true);
  }

  return (
    <View style={styles.container}>
      { isActive ?
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          photo={true}
          codeScanner={codeScanner}
        /> :
        <View>
          <Button title="Scan Bar" onPress={handleCapture} />
          { currentFoodItem && <Text style={{fontSize: 20}}>{JSON.stringify(currentFoodItem, null, 2)}</Text>}
          <TextInput
            style={styles.input}
            onChangeText={setSearchText}
            value={searchText}
            placeholder="Search for food"
          />
          <Button title="Search" onPress={handleSearch} />
        </View>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
});

export default DietScreen;
