import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, Alert, View } from 'react-native';
import { getNutritionLabelImgInfo, searchFoodItemByText, getFoodItemByUpc } from '../network/nutrition';
import FoodOptionComponent from '../components/FoodOptionComponent';
import { showToastError } from '../utils';
import CustomModal from '../CustomModal';
import NutritionInfo from '../types/NutritionInfo';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useFoodData } from '../contexts/FoodDataContext';
import { 
  Layout, 
  Text, 
  Input, 
  Button, 
  Icon, 
  Spinner, 
  List,
  Text as KittenText 
} from '@ui-kitten/components';

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
  const { setScannedProductData } = useFoodData();

  // Authentication error handler
  const handleAuthError = useCallback(async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token and user from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Token and user removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (storageError) {
      console.error('Error removing data from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  }, [navigation]);

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
              if (error instanceof AuthenticationError) {
                handleAuthError(error);
              } else if (error.status === 504 || error.message?.includes('timeout') || error.message?.includes('504')) {
                // Handle timeout errors specifically
                showToastError('Request timed out. Please try again.');
                Alert.alert(
                  'Connection Timeout',
                  'The server took too long to respond while processing the image. Please try again later.',
                  [{ text: 'OK' }]
                );
                setIsModalLoading(false);
                setModalVisible(false);
              } else {
                showToastError("Could not get nutrition info.");
                setIsModalLoading(false);
                setModalVisible(false);
              }
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
        console.error('Error searching for food:', error);
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else if (error.status === 504 || error.message?.includes('timeout') || error.message?.includes('504')) {
          // Handle timeout errors specifically
          showToastError('Request timed out. Please try again.');
          // Show an alert for better visibility
          Alert.alert(
            'Connection Timeout',
            'The server took too long to respond. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          showToastError(error.toString());
        }
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleFoodOptionPress = async (option: any) => {
    try {
      // Get detailed product info using the ID
      const productData = await getFoodItemByUpc(option.id);
      
      // Set the detailed product data in context
      setScannedProductData(productData);
      
      // Navigate back to DietScreen
      navigation.popTo('Diet');
      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        handleAuthError(error);
      } else {
        showToastError('Failed to load product details. Please try again.');
      }
    }
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity onPress={() => handleFoodOptionPress(item)}>
      <FoodOptionComponent option={item} />
    </TouchableOpacity>
  );

  const searchIcon = (props: any) => (
    <Icon {...props} name='search' />
  );

  return (
    <Layout style={styles.container}>
      <Layout style={styles.searchBar}>
        <Input
          style={styles.input}
          value={searchText}
          placeholder="Search for food"
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchByText}
          accessoryRight={searchIcon}
          size="large"
        />
        <LinearGradient
          colors={['#444444', '#222222']}
          style={styles.gradientContainer}
        >
          <Button
            onPress={handleSearchByText}
            style={[styles.searchButton, { backgroundColor: 'transparent' }]}
            appearance="filled"
            size="large"
          >
            {(evaProps: any) => <KittenText {...evaProps} style={styles.buttonText}>Search</KittenText>}
          </Button>
        </LinearGradient>
      </Layout>
      
      {isLoading ? (
        <Layout style={styles.loadingContainer}>
          <Spinner size="large" status="primary" />
        </Layout>
      ) : (
        <List
          style={styles.list}
          data={foodOptions}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          ItemSeparatorComponent={() => null}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <CustomModal
        visible={modalVisible}
        setVisible={setModalVisible}
      >
        {
          isModalLoading ? (
            <Layout style={styles.loadingContainer}>
              <Spinner size="large" status="primary" />
            </Layout>
          ) : (
            <>
            </>
          )
        }
      </CustomModal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    width: Dimensions.get("window").width,
  },
  input: {
    flex: 1,
    marginRight: 4,
  },
  gradientContainer: {
    marginLeft: 4,
    borderRadius: 15,
    overflow: 'hidden',
  },
  searchButton: {
    height: 50,
    borderRadius: 15,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  listContent: {
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 0,
    borderWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DietLogScreen;

