import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { searchFoodItemByText } from '../network/nutrition';
import FoodOptionComponent from '../components/FoodOptionComponent';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToastError } from '../utils';
import MacroCalculator from '../components/MacroCalculator';
import CustomModal from '../CustomModal';

interface DietLogScreenProps {
  route: any;
  navigation: any;
}

const DietLogScreen = ({ navigation, route }: DietLogScreenProps) => {
  const [searchText, setSearchText] = useState('');
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [option, setOption] = useState<any>({});

  useEffect(() => {
    if (route.params?.productResponse) {
      setOption(route.params?.productResponse);
      setModalVisible(true);
    }
  }, [route.params?.productResponse]);

  const handleSearchByText = async () => {
    if (searchText) {
      setIsLoading(true);
      try {
        const result = await searchFoodItemByText(searchText);
        setFoodOptions(result.products);
      } catch (error: any) {
        showToastError(error.toString());
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleFoodOptionPress = async (option: any) => {
    setOption(option);
    setModalVisible(true);
  }

  return (
    <>
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView>
            {foodOptions.map((option, index) => (
              <TouchableOpacity key={index} onPress={() => handleFoodOptionPress(option)}>
                <FoodOptionComponent option={option} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity style={styles.barcodeIcon} onPress={() => navigation.navigate('BarcodeScanner')}>
          <MaterialCommunityIcons name="barcode-scan" size={60} color="black" />
        </TouchableOpacity>
      </View>
      <CustomModal
        visible={modalVisible}
        setVisible={setModalVisible}
      >
        { modalVisible && <MacroCalculator setModalVisible={setModalVisible} productResponse={option} /> }
      </CustomModal>

    </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DietLogScreen;
