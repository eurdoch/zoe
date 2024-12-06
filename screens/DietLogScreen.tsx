import React, { useState } from 'react';
import { View, ScrollView, Button, TextInput, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { searchFoodItemByText } from '../network/nutrition';
import FoodOptionComponent from '../components/FoodOptionComponent';
import BarcodeScanner from '../components/BarcodeScanner';
import { useModal } from '../modals/ModalContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToastError } from '../utils';
import MacroCalculator from '../components/MacroCalculator';

interface DietLogScreenProps {
  setLogActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const DietLogScreen = ({ setLogActive }: DietLogScreenProps) => {
  const [searchText, setSearchText] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const { showModal } = useModal();

  const handleSearchByText = async () => {
    if (searchText) {
      try {
        const result = await searchFoodItemByText(searchText);
        console.log(result.products[0]);
        setFoodOptions(result.products);
      } catch (error: any) {
        showToastError(error.toString());
      }
    }
  }

  const handleFoodOptionPress = async (option: any) => {
    showModal(<MacroCalculator productResponse={option} setLogActive={setLogActive} />)
  }

  // TODO add dropdown menu with search so dropdown is filled with search results on autocomplete
  return (
    <View style={styles.container}>
      {cameraActive ?
        <BarcodeScanner setLogActive={setLogActive} cameraActive={cameraActive} setCameraActive={setCameraActive} /> :
        <View>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.input}
              onChangeText={setSearchText}
              value={searchText}
              placeholder="Search for food"
              onSubmitEditing={handleSearchByText}
            />
            <Button title="Search" onPress={handleSearchByText} />
            <TouchableOpacity onPress={() => setCameraActive(true)}>
              <MaterialCommunityIcons name="barcode-scan" size={40} color="black" />
            </TouchableOpacity>
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
    padding: 10,
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: Dimensions.get("window").width - 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    flex: 1,
  },
});

export default DietLogScreen;

