import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { getNutritionLabelImgInfo, searchFoodItemByText } from '../network/nutrition';
import FoodOptionComponent from '../components/FoodOptionComponent';
import { showToastError } from '../utils';
import MacroCalculator from '../components/MacroCalculator';
import MacroByLabelCalculator from '../components/MacroByLabelCalculator';
import CustomModal from '../CustomModal';
import NutritionInfo from '../types/NutritionInfo';
import { 
  Layout, 
  Text, 
  Input, 
  Button, 
  Icon, 
  Spinner, 
  List 
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

  const renderItem = ({ item, index }) => (
    <TouchableOpacity onPress={() => handleFoodOptionPress(item)}>
      <FoodOptionComponent option={item} />
    </TouchableOpacity>
  );

  const searchIcon = (props) => (
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
        <Button
          onPress={handleSearchByText}
          style={styles.searchButton}
          appearance="filled"
          status="primary"
        >
          Search
        </Button>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 16,
    marginTop: 8,
    width: Dimensions.get("window").width,
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    borderRadius: 4,
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

