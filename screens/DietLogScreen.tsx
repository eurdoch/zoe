import React, { useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { searchFoodItemByText } from '../network/nutrition';
import FoodOptionComponent from '../components/FoodOptionComponent';
import { useModal } from '../modals/ModalContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToastError } from '../utils';
import MacroCalculator from '../components/MacroCalculator';
interface DietLogScreenProps {
  navigation: any;
}
const DietLogScreen = ({ navigation }: DietLogScreenProps) => {
  const [searchText, setSearchText] = useState('');
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const { showModal } = useModal();
  const handleSearchByText = async () => {
    if (searchText) {
      try {
        const result = await searchFoodItemByText(searchText);
        setFoodOptions(result.products);
      } catch (error: any) {
        showToastError(error.toString());
      }
    }
  }
  const handleFoodOptionPress = async (option: any) => {
    showModal(<MacroCalculator productResponse={option} />)
  }
  // TODO add dropdown menu with search so dropdown is filled with search results on autocomplete
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          onChangeText={setSearchText}
          value={searchText}
          placeholder="Search for food"
          onSubmitEditing={handleSearchByText}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchByText}>
          <MaterialCommunityIcons name="magnify" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {foodOptions.map((option, index) => (
          <TouchableOpacity key={index} onPress={() => handleFoodOptionPress(option)}>
            <FoodOptionComponent option={option} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.barcodeIcon} onPress={() => navigation.navigate('BarcodeScanner')}>
        <MaterialCommunityIcons name="barcode-scan" size={60} color="black" />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: Dimensions.get("window").width - 20,
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  barcodeIcon: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});
export default DietLogScreen;
