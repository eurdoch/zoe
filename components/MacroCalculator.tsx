import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { showToastError, showToastInfo } from '../utils';
import OldProductResponse, { ProductResponse } from '../types/ProductResponse';
import Food from '../types/Food';
import { postFood } from '../network/food';

interface MacroCalculatorProps {
  productResponse: ProductResponse | OldProductResponse;
  setModalVisible: any;
}

const UNITS = [
  { label: 'g', value: 'g' },
  { label: 'oz', value: 'oz' },
  { label: 'lb', value: 'lb' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
];

const MacroCalculator: React.FC<MacroCalculatorProps> = ({
  productResponse,
  setModalVisible,
}) => {
  const [servingAmount, setServingAmount] = useState<string>('100');
  const [servingUnit, setServingUnit] = useState<string>('g');

  // Conversion factors to grams
  const unitConversions: { [key: string]: number } = {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
    ml: 1, // Assuming density of 1g/ml for simplicity
    l: 1000,
  };

  // Helper function to determine if we're using the new or legacy product response
  const isNewProductResponse = (prod: any): prod is ProductResponse => {
    return 'product' in prod && 'code' in prod;
  };
  
  // Helper function to extract nutrition values from the product response
  const getNutritionValues = () => {
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
          nutriments['fiber'] || 
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
    if (isNewProductResponse(productResponse)) {
      return productResponse.product.product_name;
    } else {
      return productResponse.name;
    }
  };
  
  const getProductBrand = () => {
    if (isNewProductResponse(productResponse)) {
      return productResponse.product.brands;
    } else {
      return productResponse.brand;
    }
  };

  const calculateMacros = async () => {
    const amount = parseFloat(servingAmount);
    if (isNaN(amount) || amount <= 0) {
      showToastError('Amount must be a number');
      return;
    }

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
    
    const newFood: Food = {
      brand: productBrand,
      categories: isNewProductResponse(productResponse) ? [] : productResponse.categories,
      id: isNewProductResponse(productResponse) ? productResponse.code : productResponse.id,
      name: productName,
      macros: calculatedMacros,
      createdAt: Math.floor(Date.now() / 1000),
    };
    
    // Log product details and calculated macros to console
    console.log('--- Product Nutrition Information ---');
    console.log(`Product: ${productName}`);
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
      setModalVisible(false);
      showToastInfo('Food added.');
    } else {
      showToastError('Food could not be added, try again.');
    }
  };

  const productName = getProductName();
  const productBrand = getProductBrand();

  return (
    <View>
      <Text style={styles.productName}>
        {productName}
      </Text>
      {productBrand && (
        <Text style={styles.brandName}>{productBrand}</Text>
      )}

      {/* Serving Size Input */}
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

      <Button title="Add" onPress={calculateMacros} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  servingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  unitOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unitOptionText: {
    fontSize: 16,
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  macrosContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  macrosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 16,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MacroCalculator;
