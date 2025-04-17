import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getNutritionLabelImgInfo, searchFoodItemByText } from '../network/nutrition';
import FoodOptionComponent from '../components/FoodOptionComponent';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToastError } from '../utils';
import MacroCalculator from '../components/MacroCalculator';
import MacroByLabelCalculator from '../components/MacroByLabelCalculator';
import CustomModal from '../CustomModal';
import NutritionInfo from '../types/NutritionInfo';

interface DietLogScreenProps {
  route: any;
  navigation: any;
}

const DietLogScreen = ({ navigation, route }: DietLogScreenProps) => {
  const [searchText, setSearchText] = useState('');
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo>({});
  const [foodOptions, setFoodOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('product');
  const [option, setOption] = useState<any>({});
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        console.log(route);
        if (route.params?.photo) {
          setModalContent('image');
          setIsModalLoading(true);
          setModalVisible(true);
          fetch(`file://${route.params?.photo.path}`)
            .then(result => result.blob())
            .then(data => new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(data);
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = error => reject(error);
            }))
            .then(base64Data => {
              const stringData = base64Data as string;
              const rawImageString = stringData.slice(23);
              return getNutritionLabelImgInfo(rawImageString);
            })
            .then(nInfo => {
              setNutritionInfo(nInfo);
              setIsModalLoading(true);
              setModalContent('image');
              setModalVisible(true);
            })
            .catch(error => {
              console.log(error);
              showToastError("Could not get nutrition info.");
              setIsModalLoading(false);
              setModalVisible(false);
            });
        } else if (route.params?.productResponse) {
          setOption(route.params?.productResponse);
          setModalContent('product');
          setModalVisible(true);
        }
      });

      return unsubscribe;
  }, [navigation]);

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
    setModalContent('product');
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
        <View style={styles.iconTray}>
          <TouchableOpacity onPress={() => navigation.navigate('BarcodeScanner')}>
            <MaterialCommunityIcons name="barcode-scan" size={60} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('NutritionLabelParser')}>
            <MaterialCommunityIcons name="alpha-n-box" size={60} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <CustomModal
        visible={modalVisible}
        setVisible={setModalVisible}
      >
        {
          isModalLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <>
              {modalContent === 'product' && (
                <MacroCalculator
                  setModalVisible={setModalVisible}
                  productResponse={option}
                />
              )}
              {modalContent === 'image' && (
                <MacroByLabelCalculator loadDat={() => {}} setModalVisible={setModalVisible} nutritionInfo={nutritionInfo} />
              )}
            </>
          )
        }
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
  iconTray: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DietLogScreen;

