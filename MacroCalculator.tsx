import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { showToastError, showToastInfo } from './utils';
import { ProductResponse } from './types/ProductResponse';
import { Food } from './types/FoodEntry';
import { postFood } from './network/food';
import { useModal } from './ModalContext';

interface MacroCalculatorProps {
  productResponse: ProductResponse;
  setLogActive: React.Dispatch<React.SetStateAction<boolean>>;
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
  setLogActive,
}) => {
  const [servingAmount, setServingAmount] = useState<string>('100');
  const [servingUnit, setServingUnit] = useState<string>('g');
  const { hideModal } = useModal();

  // Conversion factors to grams
  const unitConversions: { [key: string]: number } = {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
    ml: 1, // Assuming density of 1g/ml for simplicity
    l: 1000,
  };

  const calculateMacros = async () => {
    const amount = parseFloat(servingAmount);
    if (isNaN(amount) || amount <= 0) {
      showToastError('Amount must be a number');
      return;
    }

    const amountInGrams = amount * unitConversions[servingUnit];
    const ratio = amountInGrams / 100;
    const nutriments = productResponse.nutriments;

    const calculatedMacros = {
      calories: Math.round(nutriments.calories * ratio * 10) / 10,
      protein: Math.round(nutriments.protein * ratio * 10) / 10,
      carbs: Math.round(nutriments.carbs * ratio * 10) / 10,
      fat: Math.round(nutriments.fat * ratio * 10) / 10,
      fiber: Math.round(nutriments.fiber * ratio * 10) / 10,
    };
    const newFood: Food = {
      brand: productResponse.brand,
      categories: productResponse.categories,
      id: productResponse.id,
      name: productResponse.name,
      macros: calculatedMacros,
    };
    const result = await postFood(newFood);
    if (result.acknowledged) {
      setLogActive(false);
      hideModal();
      showToastInfo('Food added.');
      // TODO navigate awayu
    } else {
      showToastError('Food could not be added, try again.');
    }
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
