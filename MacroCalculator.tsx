import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { showToastError } from './utils';

const UNITS = [
  { label: 'grams', value: 'g' },
  { label: 'ounces', value: 'oz' },
  { label: 'pounds', value: 'lb' },
  { label: 'kilograms', value: 'kg' },
  { label: 'milliliters', value: 'ml' },
  { label: 'liters', value: 'l' },
];

const MacroCalculator: React.FC<MacroCalculatorProps> = ({
  productResponse,
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

  useEffect(() => {
    calculateMacros();
  }, [servingAmount, servingUnit]);

  const calculateMacros = () => {
    const amount = parseFloat(servingAmount);
    if (isNaN(amount) || amount <= 0) {
      showToastError('Amount must be a number');
      return;
    }

    const amountInGrams = amount * unitConversions[servingUnit];
    const ratio = amountInGrams / 100;
    const { nutriments } = productResponse;

    const macros = {
      calories: Math.round(nutriments['energy-kcal_100g'] * ratio * 10) / 10,
      protein: Math.round(nutriments.proteins_100g * ratio * 10) / 10,
      carbs: Math.round(nutriments.carbohydrates_100g * ratio * 10) / 10,
      fat: Math.round(nutriments.fat_100g * ratio * 10) / 10,
      fiber: Math.round(nutriments.fiber_100g * ratio * 10) / 10,
    };
  };

  return (
    <View>
      <Text style={styles.productName}>
        {productResponse.name}
      </Text>
      {productResponse.brand && (
        <Text style={styles.brandName}>{productResponse.brand}</Text>
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
