import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, ScrollView } from 'react-native';
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
  data?: string;
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
  closeModal,
  data = ''
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
    onActionSelected('barcode');
  };

  // Placeholder handler for camera icon - does nothing for now
  const handleCameraPress = () => {
    onActionSelected('image');
  };
  
  // Handler for Add button - process all available food data
  const handleAddPress = async () => {
    // TODO this needs to analyze the data and if doesn't need LLM call revert to other methods
    // Use consolidated data if available, otherwise fallback to product response
    if (!productResponse && !data) {
      console.log('Add button pressed - no food data available');
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

      // Get macro values from product or consolidated data
      let calculatedMacros;
      
      if (productResponse) {
        const amountInGrams = amount * unitConversions[servingUnit];
        const ratio = amountInGrams / 100;
        const nutritionValues = getNutritionValues();

        calculatedMacros = {
          calories: Math.round(nutritionValues.calories * ratio * 10) / 10,
          protein: Math.round(nutritionValues.protein * ratio * 10) / 10,
          carbs: Math.round(nutritionValues.carbs * ratio * 10) / 10,
          fat: Math.round(nutritionValues.fat * ratio * 10) / 10,
          fiber: Math.round(nutritionValues.fiber * ratio * 10) / 10,
        };
      } else {
        // Extract nutrition info from consolidated data using helper function
        const protein = extractNumberFromConsolidated('protein_grams', 0);
        const carbs = extractNumberFromConsolidated('carb_grams', 0);
        const fat = extractNumberFromConsolidated('fat_grams', 0);
        const fiber = extractNumberFromConsolidated('fiber_grams', 0);
        
        // Try alternative keys if the standard ones aren't found
        const proteinAlt = extractNumberFromConsolidated('protein', protein);
        const carbsAlt = extractNumberFromConsolidated('carbs', carbs);
        const fatAlt = extractNumberFromConsolidated('fat', fat);
        const fiberAlt = extractNumberFromConsolidated('fiber', fiber);
        
        // Calculate calories if not provided (4 cal/g for protein & carbs, 9 cal/g for fat)
        const extractedCalories = extractNumberFromConsolidated('calories', 0);
        const calories = extractedCalories > 0 ? 
          extractedCalories : 
          (proteinAlt * 4) + (carbsAlt * 4) + (fatAlt * 9);
          
        calculatedMacros = {
          calories: Math.round(calories * 10) / 10,
          protein: Math.round(proteinAlt * 10) / 10,
          carbs: Math.round(carbsAlt * 10) / 10,
          fat: Math.round(fatAlt * 10) / 10,
          fiber: Math.round(fiberAlt * 10) / 10
        };
      }
      
      // Create new food entry - try multiple possible data sources
      const productName = getProductName() || 
                         extractDataFromConsolidated('Product', '') || 
                         extractDataFromConsolidated('Food Analysis', '') ||
                         extractDataFromConsolidated('Food Name', 'Food Item');
      
      const productBrand = getProductBrand() || 
                          extractDataFromConsolidated('Brand', '') || 
                          extractDataFromConsolidated('Manufacturer', '');
      
      // Include description and other consolidated data in name if provided
      let foodName = productName;
      
      if (description) {
        foodName = `${foodName} (${description})`;
      }
      
      // Add any other relevant data from consolidated string if not already included
      const foodAnalysisName = extractDataFromConsolidated('Food Analysis');
      if (foodAnalysisName && foodName !== foodAnalysisName && !foodName.includes(foodAnalysisName)) {
        foodName = `${foodName} - ${foodAnalysisName}`;
      }
      
      // Add Nutrition Label information if available
      const nutritionLabelInfo = extractDataFromConsolidated('Nutrition Label');
      if (nutritionLabelInfo && !foodName.includes('Nutrition Label')) {
        foodName = `${foodName} [Label Data]`;
      }
      
      const newFood: Food = {
        brand: productBrand,
        categories: productResponse && isNewProductResponse(productResponse) ? 
          [] : (productResponse?.categories || []),
        id: productResponse && isNewProductResponse(productResponse) ? 
          productResponse.code : (productResponse?.id || `food-${Date.now()}`),
        name: foodName,
        macros: calculatedMacros,
        createdAt: Math.floor(Date.now() / 1000),
      };
      
      // Log product details and calculated macros to console
      console.log('--- Food Entry Information ---');
      console.log(`Name: ${foodName}`);
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
  const hasAnyData = hasProductData || !!consolidatedData;

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
      
      {/* Display consolidated data summary if available */}
      {consolidatedData && (
        <View style={styles.consolidatedDataContainer}>
          <Text style={styles.consolidatedDataTitle}>Food Information:</Text>
          <ScrollView style={styles.consolidatedDataScroll}>
            {/* Format the consolidated data for better readability */}
            <View style={styles.dataSection}>
              {/* Product Information Section */}
              {extractDataFromConsolidated('Product') && (
                <View style={styles.dataSectionItem}>
                  <Text style={styles.dataSectionLabel}>Product:</Text>
                  <Text style={styles.dataSectionValue}>{extractDataFromConsolidated('Product')}</Text>
                </View>
              )}
              
              {extractDataFromConsolidated('Brand') && (
                <View style={styles.dataSectionItem}>
                  <Text style={styles.dataSectionLabel}>Brand:</Text>
                  <Text style={styles.dataSectionValue}>{extractDataFromConsolidated('Brand')}</Text>
                </View>
              )}
              
              {extractDataFromConsolidated('Food Analysis') && (
                <View style={styles.dataSectionItem}>
                  <Text style={styles.dataSectionLabel}>Identified As:</Text>
                  <Text style={styles.dataSectionValue}>{extractDataFromConsolidated('Food Analysis')}</Text>
                </View>
              )}
              
              {extractDataFromConsolidated('Nutrition Label') && (
                <View style={styles.dataSectionItem}>
                  <Text style={styles.dataSectionLabel}>Label Info:</Text>
                  <Text style={styles.dataSectionValue}>{extractDataFromConsolidated('Nutrition Label')}</Text>
                </View>
              )}
              
              {/* Nutrition Data Section */}
              <View style={styles.macroSection}>
                <Text style={styles.macroSectionTitle}>Nutrition Facts (per 100g):</Text>
                
                {extractNumberFromConsolidated('calories', -1) > 0 && (
                  <View style={styles.dataSectionItem}>
                    <Text style={styles.dataSectionLabel}>Calories:</Text>
                    <Text style={styles.dataSectionValue}>{extractNumberFromConsolidated('calories')} kcal</Text>
                  </View>
                )}
                
                {extractNumberFromConsolidated('protein_grams', -1) > 0 && (
                  <View style={styles.dataSectionItem}>
                    <Text style={styles.dataSectionLabel}>Protein:</Text>
                    <Text style={styles.dataSectionValue}>{extractNumberFromConsolidated('protein_grams')}g</Text>
                  </View>
                )}
                
                {extractNumberFromConsolidated('carb_grams', -1) > 0 && (
                  <View style={styles.dataSectionItem}>
                    <Text style={styles.dataSectionLabel}>Carbs:</Text>
                    <Text style={styles.dataSectionValue}>{extractNumberFromConsolidated('carb_grams')}g</Text>
                  </View>
                )}
                
                {extractNumberFromConsolidated('fat_grams', -1) > 0 && (
                  <View style={styles.dataSectionItem}>
                    <Text style={styles.dataSectionLabel}>Fat:</Text>
                    <Text style={styles.dataSectionValue}>{extractNumberFromConsolidated('fat_grams')}g</Text>
                  </View>
                )}
                
                {extractNumberFromConsolidated('fiber_grams', -1) > 0 && (
                  <View style={styles.dataSectionItem}>
                    <Text style={styles.dataSectionLabel}>Fiber:</Text>
                    <Text style={styles.dataSectionValue}>{extractNumberFromConsolidated('fiber_grams')}g</Text>
                  </View>
                )}
              </View>
              
              {/* Show the raw data if there's nothing extracted */}
              {!extractDataFromConsolidated('Product') && 
               !extractDataFromConsolidated('Brand') && 
               !extractDataFromConsolidated('Food Analysis') && 
               extractNumberFromConsolidated('calories', -1) <= 0 && (
                <Text style={styles.consolidatedDataText}>{consolidatedData}</Text>
              )}
            </View>
          </ScrollView>
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
          disabled={!hasAnyData || (hasProductData && (!servingAmount || isNaN(parseFloat(servingAmount))))}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.gradientAddButton}
          >
            <Text style={styles.addButtonText}>{hasAnyData ? 'Add to Diet Log' : 'Add'}</Text>
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
    padding: 10,
    paddingTop: 15,
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
  consolidatedDataContainer: {
    width: '100%',
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  consolidatedDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  consolidatedDataScroll: {
    maxHeight: 170,
  },
  consolidatedDataText: {
    fontSize: 14,
    color: '#333',
  },
  dataSection: {
    width: '100%',
  },
  dataSectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  dataSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    flex: 1,
  },
  dataSectionValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  macroSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
  macroSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
});

export default FoodEntryModalContent;
