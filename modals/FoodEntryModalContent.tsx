import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { mdiBarcodeScan } from '@mdi/js';
import { Dropdown } from 'react-native-element-dropdown';
import OldProductResponse, { ProductResponse } from '../types/ProductResponse';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFoodData } from '../contexts/FoodDataContext';
import { postFood } from '../network/food';
import { showToastError, showToastInfo } from '../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationError } from '../errors/NetworkError';
import { getApiBaseUrl } from '../config';

interface Props {
  onFoodAdded?: () => void;
  closeModal: () => void;
}

const UNITS = [
  { label: 'g', value: 'g' },
];

const FoodEntryModalContent: React.FC<Props> = ({ 
  onFoodAdded,
  closeModal,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { scannedProductData, description, images, clearFoodData, setDescription } = useFoodData();
  const [foodName, setFoodName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<string>('g');

  // Set food name from scannedProductData when available
  useEffect(() => {
    if (scannedProductData?.product?.product_name) {
      const productName = scannedProductData.product.product_name;
      const brandName = scannedProductData.product.brands;
      
      // Concatenate brand name and product name if both exist
      if (brandName && brandName.trim()) {
        setFoodName(`${brandName} ${productName}`);
      } else {
        setFoodName(productName);
      }
    }
  }, [scannedProductData]);

  const handleCameraPress = () => {
    closeModal();
    navigation.navigate('FoodImageAnalyzer');
  };
  
  const handleBarcodePress = () => {
    closeModal();
    navigation.navigate('BarcodeScanner');
  };
  
  const handleSearchPress = () => {
    closeModal();
    navigation.navigate('DietLog');
  };

  const handleAddPress = async () => {
    // Check if we have any data to work with
    const hasImages = images && images.length > 0;
    const hasDescription = description && description.trim() !== '';
    const hasScannedData = scannedProductData;
    
    // If no data at all, show error
    if (!hasImages && !hasDescription && !hasScannedData) {
      showToastError('Please add an image, description, or scan a barcode to continue');
      return;
    }
    
    // If we have only scanned data and no images/description, use scanned data directly
    if (!hasImages && !hasDescription && hasScannedData && amount && foodName.trim()) {
      // Validate amount is a number
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        showToastError('Please enter a valid amount in grams');
        return;
      }
      
      try {
        // Calculate macros from scanned product data
        // Amount is in grams, nutriments are per 100g
        const nutriments = scannedProductData.product.nutriments;
        const scaleFactor = amountNum / 100;
        
        const macros = {
          calories: Math.round((nutriments['energy-kcal_100g'] || 0) * scaleFactor),
          protein: Math.round((nutriments['proteins_100g'] || 0) * scaleFactor * 10) / 10,
          carbs: Math.round((nutriments['carbohydrates_100g'] || 0) * scaleFactor * 10) / 10,
          fat: Math.round((nutriments['fat_100g'] || 0) * scaleFactor * 10) / 10,
          fiber: Math.round((nutriments['fiber_100g'] || 0) * scaleFactor * 10) / 10
        };
        
        // Get user ID from storage
        const userJson = await AsyncStorage.getItem('user');
        if (!userJson) {
          throw new Error('User not found');
        }
        const user = JSON.parse(userJson);
        
        // Create food entry object
        const foodEntry = {
          name: foodName.trim(),
          brand: scannedProductData.product.brands || '',
          categories: [], // Empty categories for now
          macros: macros,
          createdAt: Math.floor(Date.now() / 1000), // Unix timestamp
          user_id: user.id
        };
        
        // Save food entry to database
        await postFood(foodEntry);
        
        showToastInfo('Food entry added successfully');
        
        // Clear food data context
        clearFoodData();
        
        // Call onFoodAdded if provided to refresh the food list
        if (onFoodAdded) {
          onFoodAdded();
        }
        
        closeModal();
        return;
        
      } catch (error) {
        console.error('Error saving food entry:', error);
        if (error instanceof AuthenticationError) {
          showToastError('Authentication failed. Please log in again.');
        } else {
          showToastError('Failed to save food entry. Please try again.');
        }
        return;
      }
    }
    
    // If we have images, description, or need AI analysis, make request to /macro
    if (hasImages || hasDescription || hasScannedData) {
      try {
        // Make request to /macro endpoint
        const baseUrl = await getApiBaseUrl();
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          showToastError('Authentication required. Please log in again.');
          return;
        }
        
        // Build comprehensive data object
        const requestData = {
          description: description || '',
          foodName: foodName.trim(),
          amount: amount ? `${amount}${unit}` : ''
        };
        
        // Add scanned product data if available
        if (hasScannedData) {
          requestData.scannedProductData = scannedProductData;
        }
        
        const requestBody = {
          images: images || [],
          data: requestData
        };
        
        const response = await fetch(`${baseUrl}/macro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            showToastError('Authentication failed. Please log in again.');
            return;
          }
          throw new Error(`Macro request failed: ${response.status}`);
        }
        
        const macroResponse = await response.json();
        console.log('Macro response:', macroResponse);
        
        // Use macro response to create food entry
        if (macroResponse && macroResponse.macros && macroResponse.macros.calories !== undefined) {
          // Get user ID from storage
          const userJson = await AsyncStorage.getItem('user');
          if (!userJson) {
            throw new Error('User not found');
          }
          const user = JSON.parse(userJson);
          
          // Create food entry object using macro response
          const foodEntry = {
            name: foodName.trim() || 'AI Analyzed Food',
            brand: hasScannedData ? (scannedProductData.product.brands || '') : '',
            categories: [], // Empty categories for now
            macros: {
              calories: macroResponse.macros.calories || 0,
              carbs: macroResponse.macros.carbs || 0,
              fat: macroResponse.macros.fat || 0,
              fiber: macroResponse.macros.fiber || 0,
              protein: macroResponse.macros.protein || 0
            },
            createdAt: Math.floor(Date.now() / 1000), // Unix timestamp
            user_id: user.id
          };
          
          // Save food entry to database
          await postFood(foodEntry);
          
          showToastInfo('Food entry added successfully');
          
          // Clear food data context
          clearFoodData();
          
          // Call onFoodAdded if provided to refresh the food list
          if (onFoodAdded) {
            onFoodAdded();
          }
          
          closeModal();
          return;
        } else {
          showToastError('Invalid macro analysis response');
          return;
        }
        
      } catch (error) {
        console.error('Error making macro request:', error);
        showToastError('Failed to analyze macro content. Please try again.');
        return;
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Food Entry</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={foodName}
          onChangeText={setFoodName}
          placeholder="Food name"
          placeholderTextColor="#999"
          multiline={true}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.servingContainer}>
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.textInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.unitContainer}>
          <Dropdown
            style={styles.dropdown}
            data={UNITS}
            labelField="label"
            valueField="value"
            value={unit}
            onChange={item => setUnit(item.value)}
            placeholder="Unit"
            placeholderStyle={{color: '#999'}}
          />
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor="#999"
          multiline={true}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCameraPress}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <Icon name="camera-outline" width={28} height={28} fill="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleBarcodePress}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <Svg width={28} height={28} viewBox="0 0 24 24">
              <Path fill="#FFFFFF" d={mdiBarcodeScan} />
            </Svg>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSearchPress}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientButton}
          >
            <Icon name="search-outline" width={28} height={28} fill="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddPress}
      >
        <LinearGradient
          colors={['#444444', '#222222']}
          style={styles.addButtonGradient}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 10,
    paddingTop: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: '100%',
    height: 42,
  },
  multilineInput: {
    height: 60,
    paddingTop: 10,
  },
  servingContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountContainer: {
    flex: 1,
    marginRight: 10,
  },
  unitContainer: {
    width: 80,
  },
  dropdown: {
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientButton: {
    width: 60,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  addButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default FoodEntryModalContent;
