import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Button, Animated, Alert, Platform, Linking } from 'react-native';
import FoodEntry from '../types/FoodEntry';
import { deleteFood, getFoodByUnixTime } from '../network/food';
import { showToastError, showToastInfo } from '../utils';
import CustomModal from '../CustomModal';
import NutritionInfo from '../types/NutritionInfo';
import MacroByLabelCalculator from '../components/MacroByLabelCalculator';
import MacroCalculator from '../components/MacroCalculator';
import { Icon } from '@ui-kitten/components';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { useFoodData } from '../contexts/FoodDataContext';

interface DietScreenProps {
  navigation: any;
  route: any;
}

const DietScreen = ({ navigation, route }: DietScreenProps) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [totalCalories, setTotalCalories] = useState<number | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<FoodEntry | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState<boolean>(false);
  
  // Use the food data context instead of local state
  const { 
    nutritionInfo, 
    scannedProduct, 
    setNutritionInfo, 
    setScannedProduct 
  } = useFoodData();
  
  // Animation values for the expanding FAB menu
  const animation = useState(new Animated.Value(0))[0];

  const onFoodAdded = () => {
    setModalVisible(false);
    setNutritionInfo(null);
    setScannedProduct(null);
    loadData();
  }

  const loadData = () => {
    const today = Math.floor(Date.now() / 1000);
    getFoodByUnixTime(today).then(entries => {
      console.log('entries', entries);
      let count = 0;
      entries.forEach(entry => {
        count += entry.macros.calories;
      });
      setTotalCalories(count);
      setFoodEntries(entries);
    });
  }

  useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        console.log('DietScreen focused');
        loadData();
        if (nutritionInfo) {
          setDeleteEntry(null);
          setModalVisible(true);
        }
        else if (scannedProduct) {
          setDeleteEntry(null);
          setModalVisible(true);
        }
      });

      return unsubscribe;
  }, [navigation, nutritionInfo, scannedProduct]);

  const handleDeleteEntry = (id: string) => {
    deleteFood(id).then(result => {
      if (result.acknowledged) {
        showToastInfo('Food entry deleted.');
        loadData();
      } else {
        showToastError('Food entry could not be deleted, try again.');
      }
    });
    setModalVisible(false);
    setDeleteEntry(null);
  }

  const checkDelete = (entry: FoodEntry) => {
    setDeleteEntry(entry);
    setModalVisible(true);
  }

  const toggleFabMenu = () => {
    const toValue = isFabMenuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setIsFabMenuOpen(!isFabMenuOpen);
  };

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
        
      // First check the current permission status
      const result = await check(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
          
        case RESULTS.DENIED:
          // Permission hasn't been requested yet, so request it
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED;
          
        case RESULTS.BLOCKED:
          // Permission is denied and not requestable anymore
          Alert.alert(
            "Camera Permission Required",
            "Camera access is required to use this feature. Please enable camera permissions in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return false;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  };

  const navigateToScreen = async (screen: string) => {
    toggleFabMenu();
    
    if (screen === 'NutritionLabelParser' || screen === 'BarcodeScanner') {
      const hasPermission = await requestCameraPermission();
      
      if (hasPermission) {
        navigation.navigate(screen);
      }
    } else {
      // For screens that don't need camera permission
      navigation.navigate(screen);
    }
  };
  return (
    <View style={styles.rootContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        <Text style={styles.totalCalories}>Total Calories: {totalCalories} </Text>
      </View>
      <ScrollView style={styles.foodEntryList}>
        {foodEntries.map((entry, index) => (
          <View key={index} style={styles.foodEntry}>
            <Text style={styles.boldFont}>{entry.name}</Text>
            <View style={styles.rightSection}>
              <Text style={{fontSize: 18}}>{entry.macros.calories}</Text>
              <TouchableOpacity onPress={() => checkDelete(entry)}>
                <Icon name="trash-2-outline" style={{width: 24, height: 24}} fill="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      {/* Expanded FAB menu buttons */}
      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 220,
            transform: [
              { scale: animation },
              { 
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })
              }
            ],
            opacity: animation
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.fabMenuButton} 
          onPress={() => navigateToScreen('DietLog')}
        >
          <Icon name='search-outline' style={styles.fabMenuIcon} fill='white' />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 155,
            transform: [
              { scale: animation },
              { 
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })
              }
            ],
            opacity: animation
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.fabMenuButton} 
          onPress={() => navigateToScreen('NutritionLabelParser')}
        >
          <Icon name='file-text-outline' style={styles.fabMenuIcon} fill='white' />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 90,
            transform: [
              { scale: animation },
              { 
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })
              }
            ],
            opacity: animation
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.fabMenuButton} 
          onPress={() => navigateToScreen('BarcodeScanner')}
        >
          <Icon name='camera-outline' style={styles.fabMenuIcon} fill='white' />
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB button */}
      <TouchableOpacity 
        style={[styles.fab, isFabMenuOpen ? styles.fabActive : null]} 
        onPress={toggleFabMenu}
      >
        <Animated.View style={{
          transform: [
            { 
              rotate: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '45deg']
              })
            }
          ]
        }}>
          <Icon name='plus-outline' style={styles.fabIcon} fill='white' />
        </Animated.View>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        setVisible={() => {
          setModalVisible(false);
          // Clear context when modal is closed
          setNutritionInfo(null);
          setScannedProduct(null);
        }}
      >
        { 
          deleteEntry && (
            <View>
              <Text>Delete entry?</Text>
              <Text>{deleteEntry.name + ' ' + deleteEntry.macros.calories}</Text>
              <Button title="DELETE" onPress={() => handleDeleteEntry(deleteEntry._id)} />
            </View>
          )
        }
        {
          nutritionInfo && (
            <MacroByLabelCalculator onFoodAdded={onFoodAdded} nutritionInfo={nutritionInfo} />
          ) 
        }
        {
          scannedProduct && (
            <MacroCalculator 
              productResponse={scannedProduct} 
              setModalVisible={setModalVisible} 
              onFoodAdded={onFoodAdded}
            />
          )
        }
      </CustomModal>
    </View>
  );
};
const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    padding: 10,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalCalories: {
    fontSize: 16,
    marginTop: 5,
  },
  boldFont: {
    fontWeight: 'bold',
    fontSize: 18,
    flexShrink: 1,
  },
  foodEntryList: {
    flex: 1,
    padding: 10,
  },
  foodEntry: {
    gap: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightSection: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rootContainer: {
    flex: 1,
  },
  // FAB and FAB menu styles
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  fabActive: {
    backgroundColor: '#FF3B30',
  },
  fabIcon: {
    width: 30,
    height: 30,
  },
  fabMenuItem: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 998,
  },
  fabMenuButton: {
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabMenuIcon: {
    width: 30,
    height: 30,
  }
});
export default DietScreen;
