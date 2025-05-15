import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { Icon } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { mdiBarcodeScan } from '@mdi/js';
import { Dropdown } from 'react-native-element-dropdown';
import { showToastError, showToastInfo } from '../utils';
import OldProductResponse, { ProductResponse } from '../types/ProductResponse';
import Food from '../types/Food';
import { postFood } from '../network/food';

interface Props {
  onActionSelected: (action: string, description?: string) => void;
  productResponse?: ProductResponse | OldProductResponse;
  onFoodAdded?: () => void;
  closeModal: () => void;
}

const UNITS = [
  { label: 'g', value: 'g' },
  { label: 'oz', value: 'oz' },
  { label: 'lb', value: 'lb' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
];

const FoodEntryModalContent: React.FC<Props> = ({ 
  onActionSelected, 
  productResponse, 
  onFoodAdded,
  closeModal
}) => {
  const [description, setDescription] = useState<string>('');
  const [servingAmount, setServingAmount] = useState<string>('100');
  const [servingUnit, setServingUnit] = useState<string>('g');
  
  const actions = [
    { id: 'search', icon: 'search-outline' },
  ];

  // Helper function to determine if we're using the new or legacy product response
  const isNewProductResponse = (prod: any): prod is ProductResponse => {
    return prod && 'product' in prod && 'code' in prod;
  };
  
  // Helper function to extract nutrition values from the product response
  const getNutritionValues = () => {
    if (!productResponse) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    
    if (isNewProductResponse(productResponse)) {
      const nutriments = productResponse.product.nutriments;
      return {
        calories: 
          nutriments['energy-kcal_100g'] || 
          nutriments['energy-kcal'] || 
          nutriments['energy_kcal'] || 
          nutriments['energy_100g'] || 
          nutriments['energy'] || 0,
        protein: 
          nutriments['proteins_100g'] || 
          nutriments['proteins'] || 0,
        carbs: 
          nutriments['carbohydrates_100g'] || 
          nutriments['carbohydrates'] || 
          nutriments['carbs_100g'] || 
          nutriments['carbs'] || 0,
        fat: 
          nutriments['fat_100g'] || 
          nutriments['fat'] || 0,
        fiber: 
          nutriments['fiber_100g'] || 
          nutriments['fibers_100g'] || 
          nutriments['fibers'] || 0,
      };
    } else {
      // Legacy format
      return {
        calories: productResponse.nutriments.calories || 0,
        protein: productResponse.nutriments.protein || 0,
        carbs: productResponse.nutriments.carbs || 0,
        fat: productResponse.nutriments.fat || 0,
        fiber: productResponse.nutriments.fiber || 0,
      };
    }
  };
  
  // Helper function to get product name and brand
  const getProductName = () => {
    if (!productResponse) return '';
    
    if (isNewProductResponse(productResponse)) {
      return productResponse.product.product_name;
    } else {
      return productResponse.name;
    }
  };
  
  const getProductBrand = () => {
    if (!productResponse) return '';
    
    if (isNewProductResponse(productResponse)) {
      return productResponse.product.brands;
    } else {
      return productResponse.brand;
    }
  };

  // Handler for MDI barcode scan - navigate to BarcodeScanner
  const handleMdiBarcodeScan = () => {
    onActionSelected('barcode', description);
  };

  // Placeholder handler for camera icon - does nothing for now
  const handleCameraPress = () => {
    console.log('Camera icon pressed - no action assigned');
    // No navigation for now
  };
  
  // Handler for Add button - process barcode results if available
  const handleAddPress = async () => {
    if (!productResponse) {
      console.log('Add button pressed - no product data available');
      return;
    }
    
    try {
      const amount = parseFloat(servingAmount);
      if (isNaN(amount) || amount <= 0) {
        showToastError('Amount must be a number');
        return;
      }

      // Conversion factors to grams
      const unitConversions: { [key: string]: number } = {
        g: 1,
        kg: 1000,
        oz: 28.3495,
        lb: 453.592,
        ml: 1, // Assuming density of 1g/ml for simplicity
        l: 1000,
      };

      const amountInGrams = amount * unitConversions[servingUnit];
      const ratio = amountInGrams / 100;
      const nutritionValues = getNutritionValues();

      const calculatedMacros = {
        calories: Math.round(nutritionValues.calories * ratio * 10) / 10,
        protein: Math.round(nutritionValues.protein * ratio * 10) / 10,
        carbs: Math.round(nutritionValues.carbs * ratio * 10) / 10,
        fat: Math.round(nutritionValues.fat * ratio * 10) / 10,
        fiber: Math.round(nutritionValues.fiber * ratio * 10) / 10,
      };
      
      // Create new food entry
      const productName = getProductName();
      const productBrand = getProductBrand();
      
      // Include description in name if provided
      const foodName = description ? `${productName} (${description})` : productName;
      
      const newFood: Food = {
        brand: productBrand,
        categories: isNewProductResponse(productResponse) ? [] : productResponse.categories,
        id: isNewProductResponse(productResponse) ? productResponse.code : productResponse.id,
        name: foodName,
        macros: calculatedMacros,
        createdAt: Math.floor(Date.now() / 1000),
      };
      
      // Log product details and calculated macros to console
      console.log('--- Product Nutrition Information ---');
      console.log(`Product: ${foodName}`);
      if (productBrand) {
        console.log(`Brand: ${productBrand}`);
      }
      console.log(`Amount: ${servingAmount} ${servingUnit}`);
      console.log('Calculated Macros:');
      console.log(`  Calories: ${calculatedMacros.calories}`);
      console.log(`  Protein: ${calculatedMacros.protein}g`);
      console.log(`  Carbs: ${calculatedMacros.carbs}g`);
      console.log(`  Fat: ${calculatedMacros.fat}g`);
      console.log(`  Fiber: ${calculatedMacros.fiber}g`);
      
      const result = await postFood(newFood);
      if (result.acknowledged) {
        closeModal();
        showToastInfo('Food added.');
        
        // Call the callback if provided
        if (onFoodAdded) {
          onFoodAdded();
        }
      } else {
        showToastError('Food could not be added, try again.');
      }
    } catch (error) {
      console.error('Error posting food:', error);
      showToastError('Food could not be added: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Product details from scan
  const productName = getProductName();
  const productBrand = getProductBrand();
  const hasProductData = !!productResponse;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Food Entry</Text>
      
      <View style={styles.descriptionContainer}>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor="#999"
        />
      </View>
      
      {/* Product info and serving size inputs - shown when product data is available */}
      {hasProductData && (
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{productName}</Text>
          {productBrand && <Text style={styles.brandName}>{productBrand}</Text>}
          
          <View style={styles.servingContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={servingAmount}
                onChangeText={setServingAmount}
                keyboardType="decimal-pad"
                placeholder="Enter amount"
              />
            </View>

            <Dropdown
              style={styles.unitSelector}
              data={UNITS}
              labelField="label"
              valueField="value"
              value={servingUnit}
              onChange={item => setServingUnit(item.value)}
            />
          </View>
        </View>
      )}
      
      {/* Icons - always shown */}
      <View style={styles.iconsContainer}>
        <View style={styles.iconsRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.iconButton}
              onPress={() => onActionSelected(action.id, description)}
            >
              <LinearGradient
                colors={['#444444', '#222222']}
                style={styles.gradientButton}
              >
                <Icon name={action.icon} width={28} height={28} fill="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
          
          {/* Camera Icon (No action) */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleCameraPress}
          >
            <LinearGradient
              colors={['#444444', '#222222']}
              style={styles.gradientButton}
            >
              <Icon name="camera-outline" width={28} height={28} fill="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          {/* MDI Barcode Scan Icon (Goes to BarcodeScanner) */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleMdiBarcodeScan}
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
        </View>
      </View>
      
      {/* Add Button - has different functionality based on context */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPress}
          disabled={hasProductData && (!servingAmount || isNaN(parseFloat(servingAmount)))}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientAddButton}
          >
            <Text style={styles.addButtonText}>{hasProductData ? 'Add to Diet Log' : 'Add'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  iconsContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
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
  descriptionContainer: {
    width: '100%',
    marginBottom: 15,
  },
  descriptionInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  addButtonContainer: {
    width: '100%',
    marginTop: 20,
  },
  addButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientAddButton: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  productInfoContainer: {
    width: '100%',
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
    marginRight: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  unitSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
  },
});

export default FoodEntryModalContent;