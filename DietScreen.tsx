import React, { useState } from 'react';
import { View, ScrollView, Button, TextInput, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { getFoodItemByNixItemId, searchFoodItems } from './network/nutrition';
import BarcodeScanner from './BarcodeScanner';
import FoodOption from './types/FoodOption';
import FoodOptionComponent from './FoodOptionComponent';
import { useModal } from './ModalContext';
import NewDietEntryModalContent from './NewDietEntryModalContent';

const DietScreen = () => {
  const [currentFoodItem, setCurrentFoodItem] = useState<any>({});
  const [searchText, setSearchText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const { showModal, hideModal } = useModal();

  const handleSearch = async () => {
    if (searchText) {
      const searchResult: any = await searchFoodItems(searchText); 
      const foods: any = searchResult['branded'];
      setFoodOptions(foods.map((food: any) => ({
        food_name: food.food_name,
        brand_name: food.brand_name,
        nix_item_id: food.nix_item_id,
      })));
    }
  }

  const handleFoodOptionPress = async (option: FoodOption) => {
    const item = await getFoodItemByNixItemId(option.nix_item_id);
    showModal(<NewDietEntryModalContent item={item} />)
  }

  return (
    <View style={styles.container}>
      {cameraActive ?
        <BarcodeScanner cameraActive={cameraActive} setCameraActive={setCameraActive} setCurrentFoodItem={setCurrentFoodItem} /> :
        <View>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              onChangeText={setSearchText}
              value={searchText}
              placeholder="Search for food"
              onSubmitEditing={handleSearch}
            />
            <Button title="Search" onPress={handleSearch} />
            <Button title="Scan Bar" onPress={() => setCameraActive(true)} />
          </View>
          <ScrollView>
            {foodOptions.map((option, index) => (
              <TouchableOpacity key={index} onPress={() => handleFoodOptionPress(option)}>
                <FoodOptionComponent option={option} />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
