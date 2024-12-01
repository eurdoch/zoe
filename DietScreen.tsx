import React, { useState } from 'react';
import { View, StyleSheet, Text, Button, TextInput, Dimensions } from 'react-native';
import { searchFoodNatural } from './network/nutrition';
import BarcodeScanner from './BarcodeScanner';

const DietScreen = () => {
  const [currentFoodItem, setCurrentFoodItem] = useState<any>({});
  const [searchText, setSearchText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const handleSearch = async () => {
    const searchResult = await searchFoodNatural(searchText);
    console.log(searchResult);
  }

  return (
    <View style={styles.container}>
      { cameraActive ?
        <BarcodeScanner cameraActive={cameraActive} setCameraActive={setCameraActive} setCurrentFoodItem={setCurrentFoodItem} /> :
        <View>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              onChangeText={setSearchText}
              value={searchText}
              placeholder="Search for food"
            />
            <View style={styles.buttonContainer}>
              <Button title="Search" onPress={handleSearch} />
              <Button title="Scan Bar" onPress={() => setCameraActive(true)} />
            </View>
          </View>
          { currentFoodItem && <Text style={{fontSize: 20}}>{JSON.stringify(currentFoodItem, null, 2)}</Text>}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Dimensions.get("window").width,
  },
  buttonContainer: {
    flexDirection: 'row',
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
    flex: 1,
  },
});

export default DietScreen;
