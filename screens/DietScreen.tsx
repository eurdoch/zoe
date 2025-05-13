import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Button, Animated, Alert, Platform, Linking, Dimensions } from 'react-native';
import FoodEntry from '../types/FoodEntry';
import { deleteFood, getFoodByUnixTime } from '../network/food';
import { showToastError, showToastInfo } from '../utils';
import CustomModal from '../CustomModal';
import MacroByLabelCalculator from '../components/MacroByLabelCalculator';
import MacroCalculator from '../components/MacroCalculator';
import { Icon, Datepicker, Layout } from '@ui-kitten/components';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import { useFoodData } from '../contexts/FoodDataContext';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloatingActionButton from '../components/FloatingActionButton';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

interface DietScreenProps {
  navigation: any;
  route: any;
}

// Interface for macro nutrient data
interface MacroData {
  fat: number;
  carbs: number;
  protein: number;
  fatCalories: number;
  carbsCalories: number;
  proteinCalories: number;
}

// MacroPieChart component
const MacroPieChart: React.FC<{ 
  macroData: MacroData, 
  size: number 
}> = ({ macroData, size }) => {
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  
  // Define colors for each macro nutrient
  const colors = {
    fat: '#FF9500',    // Orange
    carbs: '#4CD964',  // Green
    protein: '#007AFF' // Blue
  };
  
  // Calculate angles for each segment based on percentages
  const total = macroData.fat + macroData.carbs + macroData.protein;
  
  // If there's no data, show an empty circle
  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle 
          cx={centerX}
          cy={centerY}
          r={radius - 5} 
          fill="none"
          stroke="#E5E5EA"
          strokeWidth={10}
        />
        <SvgText
          x={centerX}
          y={centerY}
          fontSize={14}
          fontWeight="bold"
          fill="#8E8E93"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          No Data
        </SvgText>
      </Svg>
    );
  }
  
  // Calculate the SVG paths for each segment
  const createArc = (startAngle: number, endAngle: number): string => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const startX = centerX + (radius - 5) * Math.cos(startRad);
    const startY = centerY + (radius - 5) * Math.sin(startRad);
    const endX = centerX + (radius - 5) * Math.cos(endRad);
    const endY = centerY + (radius - 5) * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius - 5} ${radius - 5} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  };
  
  // Calculate angles
  let startAngle = 0;
  const fatAngle = (macroData.fat / total) * 360;
  const carbsAngle = (macroData.carbs / total) * 360;
  const proteinAngle = (macroData.protein / total) * 360;

  // Create paths
  const fatPath = createArc(startAngle, startAngle + fatAngle);
  startAngle += fatAngle;
  
  const carbsPath = createArc(startAngle, startAngle + carbsAngle);
  startAngle += carbsAngle;
  
  const proteinPath = createArc(startAngle, startAngle + proteinAngle);
  
  return (
    <Svg width={size} height={size}>
      {macroData.fat > 0 && <Path d={fatPath} fill={colors.fat} />}
      {macroData.carbs > 0 && <Path d={carbsPath} fill={colors.carbs} />}
      {macroData.protein > 0 && <Path d={proteinPath} fill={colors.protein} />}
      
      {/* Center circle for better appearance */}
      <Circle cx={centerX} cy={centerY} r={radius / 3} fill="white" />
    </Svg>
  );
};

// MacroLegend component
const MacroLegend: React.FC<{ macroData: MacroData }> = ({ macroData }) => {
  return (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
        <Text style={styles.legendText}>Fat: {macroData.fat}% ({Math.round(macroData.fatCalories)} cal)</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#4CD964' }]} />
        <Text style={styles.legendText}>Carbs: {macroData.carbs}% ({Math.round(macroData.carbsCalories)} cal)</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
        <Text style={styles.legendText}>Protein: {macroData.protein}% ({Math.round(macroData.proteinCalories)} cal)</Text>
      </View>
    </View>
  );
};

const DietScreen = ({ navigation, route }: DietScreenProps) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [totalCalories, setTotalCalories] = useState<number | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<FoodEntry | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState<boolean>(false);
  const [macroData, setMacroData] = useState<MacroData>({
    fat: 0,
    carbs: 0,
    protein: 0,
    fatCalories: 0,
    carbsCalories: 0,
    proteinCalories: 0
  });
  
  // Hardcoded daily calorie goal
  const dailyCalorieGoal = 1556;
  
  // Use the food data context instead of local state
  const { 
    nutritionInfo, 
    scannedProduct, 
    setNutritionInfo, 
    setScannedProduct
  } = useFoodData();
  
  // Animation values for the expanding FAB menu
  const animation = useState(new Animated.Value(0))[0];

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

  const onFoodAdded = () => {
    setModalVisible(false);
    setNutritionInfo(null);
    setScannedProduct(null);
    loadData();
  }

  // Calculate macronutrient totals and percentages
  const calculateMacroTotals = (entries: FoodEntry[]) => {
    let totalFat = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalCalories = 0;

    entries.forEach(entry => {
      totalFat += entry.macros.fat;
      totalCarbs += entry.macros.carbs;
      totalProtein += entry.macros.protein;
      totalCalories += entry.macros.calories;
    });

    // Convert to calories (1g fat = 9 calories, 1g carbs/protein = 4 calories)
    const fatCalories = totalFat * 9;
    const carbsCalories = totalCarbs * 4;
    const proteinCalories = totalProtein * 4;

    // Calculate percentages
    const totalMacroCalories = fatCalories + carbsCalories + proteinCalories;
    
    // Avoid division by zero
    const fatPercentage = totalMacroCalories > 0 ? Math.round((fatCalories / totalMacroCalories) * 100) : 0;
    const carbsPercentage = totalMacroCalories > 0 ? Math.round((carbsCalories / totalMacroCalories) * 100) : 0;
    const proteinPercentage = totalMacroCalories > 0 ? Math.round((proteinCalories / totalMacroCalories) * 100) : 0;

    return {
      totalFat,
      totalCarbs,
      totalProtein,
      totalCalories,
      fatCalories,
      carbsCalories,
      proteinCalories,
      fatPercentage,
      carbsPercentage,
      proteinPercentage
    };
  };

  const loadData = () => {
    // Convert selected date to unix timestamp (seconds)
    const dateTimestamp = Math.floor(selectedDate.getTime() / 1000);
    getFoodByUnixTime(dateTimestamp)
      .then(entries => {
        console.log('entries', entries);
        
        const macroData = calculateMacroTotals(entries);
        setTotalCalories(macroData.totalCalories);
        setFoodEntries(entries);
        
        // Set macro data for pie chart
        setMacroData({
          fat: macroData.fatPercentage,
          carbs: macroData.carbsPercentage,
          protein: macroData.proteinPercentage,
          fatCalories: macroData.fatCalories,
          carbsCalories: macroData.carbsCalories,
          proteinCalories: macroData.proteinCalories
        });
      })
      .catch(error => {
        console.error('Error loading food entries:', error);
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not load food entries. Please try again.');
        }
      });
  }

  // Add this effect to reload data when selectedDate changes
  useEffect(() => {
    loadData();
  }, [selectedDate]);
  
  // Functions to navigate between dates
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Function to handle date selection from DatePicker
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  // Calendar icon for the DatePicker
  const CalendarIcon = (props: any) => (
    <Icon {...props} name='calendar-outline'/>
  );

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
    deleteFood(id)
      .then(result => {
        if (result.acknowledged) {
          showToastInfo('Food entry deleted.');
          loadData();
        } else {
          showToastError('Food entry could not be deleted, try again.');
        }
      })
      .catch(error => {
        console.error('Error deleting food entry:', error);
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Food entry could not be deleted. Please try again.');
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
      console.log('permission result check: ', result == RESULTS.DENIED);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
          
        case RESULTS.DENIED:
          console.log('CASE DENIED');
          // Permission hasn't been requested yet, so request it
          const requestResult = await request(permission);
          console.log('requestResult case: ', requestResult == RESULTS.BLOCKED);
          if (requestResult === RESULTS.BLOCKED) {
            Alert.alert(
              "Camera Permission Required",
              "Camera access is required to use this feature. Please enable camera permissions in your device settings.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() }
              ]
            );
            return false;
          }
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
    
    if (screen === 'NutritionLabelParser' || screen === 'BarcodeScanner' || screen === 'FoodImageAnalyzer') {
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
        <View style={styles.dateNavigationContainer}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.navigationArrow}>
            <Icon name="arrow-left-outline" fill="#333" style={styles.arrowIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setDatePickerVisible(true)} 
            style={styles.datePickerButton}
          >
            <Text style={styles.date}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNextDay} style={styles.navigationArrow}>
            <Icon name="arrow-right-outline" fill="#333" style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
        
        {datePickerVisible && (
          <Datepicker
            date={selectedDate}
            onSelect={handleDateSelect}
            accessoryLeft={CalendarIcon}
            min={new Date(2000, 0, 1)}
            max={new Date(2030, 11, 31)}
            style={styles.datePicker}
          />
        )}
        
        <View style={styles.calorieContainer}>
          <Text style={styles.totalCalories}>Total Calories: {totalCalories || 0} / {dailyCalorieGoal}</Text>
        </View>
        
        {/* Macronutrient Pie Chart */}
        <View style={styles.macroChartContainer}>
          <MacroPieChart 
            macroData={macroData} 
            size={150} 
          />
          <MacroLegend macroData={macroData} />
        </View>
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
            bottom: 290, // Increased to maintain spacing with 4 buttons
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
        <View style={styles.fabWithLabelContainer}>
          <Text style={styles.fabLabel}>Search</Text>
          <FloatingActionButton
            icon="search-outline"
            onPress={() => navigateToScreen('DietLog')}
            style={styles.fabPositionReset}
          />
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 225, // Adjusted for proper spacing between buttons
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
        <View style={styles.fabWithLabelContainer}>
          <Text style={styles.fabLabel}>Scan Nutrition Label</Text>
          <FloatingActionButton
            icon="file-text-outline"
            onPress={() => navigateToScreen('NutritionLabelParser')}
            style={styles.fabPositionReset}
          />
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 160, // Increased from 95 to make room for new button
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
        <View style={styles.fabWithLabelContainer}>
          <Text style={styles.fabLabel}>Scan Barcode</Text>
          <FloatingActionButton
            icon="camera-outline"
            onPress={() => navigateToScreen('BarcodeScanner')}
            style={styles.fabPositionReset}
          />
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 95, // Bottom position for new button
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
        <View style={styles.fabWithLabelContainer}>
          <Text style={styles.fabLabel}>Use the shoggoth brain</Text>
          <FloatingActionButton
            icon="bulb-outline"
            onPress={() => navigateToScreen('FoodImageAnalyzer')}
            style={styles.fabPositionReset}
          />
        </View>
      </Animated.View>


      {/* Main FAB button */}
      {isFabMenuOpen ? (
        <TouchableOpacity 
          style={[styles.fab, styles.fabActive]} 
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
      ) : (
        <TouchableOpacity 
          style={styles.mainFabPositionReset} 
          onPress={toggleFabMenu}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientFab}
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
          </LinearGradient>
        </TouchableOpacity>
      )}

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
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Delete entry?</Text>
              <Text style={styles.deleteModalText}>{deleteEntry.name + ' ' + deleteEntry.macros.calories}</Text>
              <LinearGradient
                colors={['#444444', '#222222']}
                style={styles.gradientContainer}
              >
                <TouchableOpacity
                  onPress={() => handleDeleteEntry(deleteEntry._id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>DELETE</Text>
                </TouchableOpacity>
              </LinearGradient>
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
  dateNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  navigationArrow: {
    padding: 8,
    borderRadius: 20,
  },
  arrowIcon: {
    width: 24,
    height: 24,
  },
  datePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  datePicker: {
    width: '80%',
    maxWidth: 300,
    marginVertical: 10,
  },
  calorieContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
    gap: 20,
  },
  totalCalories: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  calorieGoal: {
    fontSize: 16,
    color: '#666',
  },
  macroChartContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    width: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 5,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
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
  // Modal styles
  deleteModalContent: {
    alignItems: 'center',
    padding: 10,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  gradientContainer: {
    marginVertical: 0,
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
  },
  deleteButton: {
    height: 60,
    borderRadius: 15,
    borderWidth: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  // FAB and FAB menu styles
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 30,
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
    right: 30,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 998,
    maxWidth: 230, // Limit maximum width
  },
  fabPositionReset: {
    position: 'relative',
    right: 0,
    bottom: 0,
  },
  mainFabPositionReset: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    zIndex: 999,
  },
  gradientFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // New styles for FAB with label
  fabWithLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center', // This centers items vertically
    justifyContent: 'flex-end',
    minWidth: 56, // At least button width
  },
  fabLabel: {
    color: 'white',
    marginRight: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    fontSize: 14,
    textAlign: 'right', // Align text to the right
    textAlignVertical: 'center', // Center text vertically (Android)
    alignSelf: 'center', // Center vertically within container
  },
  // Keeping these for backward compatibility
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
