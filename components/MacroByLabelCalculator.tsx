import {useState, useEffect} from "react";
import {View, TextInput, Button, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Modal, FlatList} from "react-native";
import {calculateMacros} from "../nutrition";
import {postFood} from "../network/food";
import NutritionInfo from "../types/NutritionInfo";
import {showToastError, showToastInfo} from "../utils";
import { Icon } from '@ui-kitten/components';

interface MacroByLabelCalculatorProps {
  nutritionInfo: NutritionInfo;
  onFoodAdded: () => void;
  navigation?: any; // Optional navigation prop for navigating back to Diet screen
}

const MacroByLabelCalculator = ({ nutritionInfo, onFoodAdded, navigation }: MacroByLabelCalculatorProps) => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedMacros, setCalculatedMacros] = useState<any>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedServingSize, setSelectedServingSize] = useState<number | null>(null);
  
  // Get available serving units from nutrition info
  const availableUnits = nutritionInfo.serving_type?.map(st => st.serving_unit) || [];
  
  // Set default unit from the first item in serving_type array if available
  useEffect(() => {
    if (nutritionInfo.serving_type && nutritionInfo.serving_type.length > 0) {
      const defaultServing = nutritionInfo.serving_type[0];
      setSelectedUnit(defaultServing.serving_unit);
      setSelectedServingSize(defaultServing.serving_size);
      // Don't set the amount field automatically
    } else if (nutritionInfo.serving_unit) {
      // Fallback to legacy format if serving_type is not available
      setSelectedUnit(nutritionInfo.serving_unit);
    } else {
      setSelectedUnit('g');
    }
  }, [nutritionInfo]);
  
  // Determine the unit to display based on the nutrition info format and selected unit
  const displayUnit = selectedUnit || nutritionInfo.serving_unit || 'g';

  // Calculate and display macros when amount changes
  const calculateAndDisplayMacros = () => {
    try {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        console.log("Calculating macros with input:", { 
          amount: parsedAmount,
          selectedUnit,
          selectedServingSize,
          nutritionInfo: JSON.stringify(nutritionInfo, null, 2)
        });
        
        // Create modified nutrition info with the selected serving size
        const modifiedNutritionInfo = { ...nutritionInfo };
        
        // If we have a selected serving size from the dropdown, use it for calculations
        if (selectedServingSize) {
          // Use the selected serving size from the dropdown
          modifiedNutritionInfo.serving_size = selectedServingSize;
        }
        
        const macros = calculateMacros(modifiedNutritionInfo, parsedAmount);
        console.log("Calculated macros:", macros);
        
        setCalculatedMacros(macros);
      } else {
        setCalculatedMacros(null);
      }
    } catch (error) {
      console.error("Error calculating macros:", error);
      setCalculatedMacros(null);
    }
  };

  // Update macros when amount changes
  const handleAmountChange = (value: string) => {
    setAmount(value);
    // Only calculate if we have a valid number
    if (/^\d*\.?\d*$/.test(value)) {
      calculateAndDisplayMacros();
    } else {
      setCalculatedMacros(null);
    }
  };

  const handleAddDietLog = async () => {
    try {
      if (!name) {
        showToastError("Please enter a name for this food item");
        return;
      }
      
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        showToastError("Please enter a valid amount");
        return;
      }
      
      setIsSubmitting(true);
      
      // Calculate macros based on nutrition info and amount
      console.log("Calculating macros for submission with input:", { 
        amount: parsedAmount,
        selectedUnit,
        selectedServingSize,
        nutritionInfo: JSON.stringify(nutritionInfo, null, 2)
      });
      
      // Create modified nutrition info with the selected serving size
      const modifiedNutritionInfo = { ...nutritionInfo };
      
      // If we have a selected serving size from the dropdown, use it for calculations
      if (selectedServingSize) {
        // Use the selected serving size from the dropdown
        modifiedNutritionInfo.serving_size = selectedServingSize;
      }
      
      const macros = calculateMacros(modifiedNutritionInfo, parsedAmount);
      console.log("Final calculated macros for submission:", macros);
      
      const createdAt = Math.floor(Date.now() / 1000);
      
      // Create food object with proper structure matching Food type
      const food = {
        name,
        brand: "", // Not available from nutrition label
        categories: [], // Not available from nutrition label
        id: `nutrition-${Date.now()}`, // Generate a unique ID
        macros,
        createdAt,
      };
      
      console.log("Posting food from nutrition label:", food);
      
      const result = await postFood(food);
      console.log("PostFood result:", result);
      
      if (!result.acknowledged) {
        showToastError("Could not save food entry, please try again.");
        setIsSubmitting(false);
        return;
      }
      
      showToastInfo(`Added ${name} to your food log`);
      
      // Refresh the food list and close the modal
      onFoodAdded();
      
      // Navigate to Diet screen if navigation prop is provided
      if (navigation) {
        navigation.navigate('Diet');
      }
    } catch (error) {
      console.error("Error adding food:", error);
      showToastError("Error adding food entry. Please try again.");
      setIsSubmitting(false);
    }
  }

  // Handle unit selection
  const handleUnitSelect = (unit: string) => {
    // Find the serving size for the selected unit
    if (nutritionInfo.serving_type) {
      const selectedServing = nutritionInfo.serving_type.find(st => st.serving_unit === unit);
      if (selectedServing) {
        setSelectedUnit(unit);
        setSelectedServingSize(selectedServing.serving_size);
        // Don't update the amount field
        
        // Close dropdown
        setDropdownVisible(false);
        
        // Only recalculate macros if amount is already entered
        if (amount) {
          calculateAndDisplayMacros();
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      
      <TextInput
        style={[styles.input, styles.nameInput]}
        onChangeText={setName}
        value={name}
        placeholder="Enter name"
        placeholderTextColor="#999"
      />
      
      <View style={styles.amountRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          onChangeText={handleAmountChange}
          value={amount}
          placeholder="Amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        {nutritionInfo.serving_type && nutritionInfo.serving_type.length > 1 ? (
          <TouchableOpacity 
            style={styles.unitSelector}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.unitText}>{displayUnit}</Text>
            <Icon name="chevron-down-outline" style={styles.dropdownIcon} fill="#999" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.unitText}>{displayUnit}</Text>
        )}
      </View>

      {/* Unit Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Select Unit</Text>
            <FlatList
              data={nutritionInfo.serving_type}
              keyExtractor={(item, index) => `serving-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.serving_unit === selectedUnit && styles.dropdownItemSelected
                  ]}
                  onPress={() => handleUnitSelect(item.serving_unit)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    item.serving_unit === selectedUnit && styles.dropdownItemTextSelected
                  ]}>
                    {item.serving_unit}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      
      {calculatedMacros && (
        <View style={styles.macrosContainer}>
          <Text style={styles.macrosTitle}>Nutrition Information</Text>
          <View style={styles.macroRow}>
            <Text>Calories:</Text>
            <Text style={styles.macroValue}>{calculatedMacros.calories}</Text>
          </View>
          <View style={styles.macroRow}>
            <Text>Protein:</Text>
            <Text style={styles.macroValue}>{calculatedMacros.protein}g</Text>
          </View>
          <View style={styles.macroRow}>
            <Text>Carbs:</Text>
            <Text style={styles.macroValue}>{calculatedMacros.carbs}g</Text>
          </View>
          <View style={styles.macroRow}>
            <Text>Fat:</Text>
            <Text style={styles.macroValue}>{calculatedMacros.fat}g</Text>
          </View>
          <View style={styles.macroRow}>
            <Text>Fiber:</Text>
            <Text style={styles.macroValue}>{calculatedMacros.fiber}g</Text>
          </View>
        </View>
      )}
      
      {isSubmitting ? (
        <View style={styles.submitButton}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleAddDietLog}
        >
          <Text style={styles.submitButtonText}>Add</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 15,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  nameInput: {
    width: '100%',
    marginBottom: 5,
  },
  macrosContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  macrosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  macroValue: {
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  unitText: {
    fontSize: 16,
    marginLeft: 5,
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e6f7ff',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownItemTextSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default MacroByLabelCalculator;

