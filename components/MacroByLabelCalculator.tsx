import {useState, useEffect} from "react";
import {View, TextInput, Button, StyleSheet, Text, ActivityIndicator, TouchableOpacity} from "react-native";
import {calculateMacros} from "../nutrition";
import {postFood} from "../network/food";
import NutritionInfo from "../types/NutritionInfo";
import {showToastError, showToastInfo} from "../utils";
import { Icon, Select, SelectItem, IndexPath } from '@ui-kitten/components';

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
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedServingSize, setSelectedServingSize] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<IndexPath | null>(null);
  
  // Get available serving units from nutrition info
  const availableUnits = nutritionInfo.serving_type?.map(st => st.serving_unit) || [];
  
  // Set default unit from the first item in serving_type array if available
  useEffect(() => {
    if (nutritionInfo.serving_type && nutritionInfo.serving_type.length > 0) {
      const defaultServing = nutritionInfo.serving_type[0];
      setSelectedUnit(defaultServing.serving_unit);
      setSelectedServingSize(defaultServing.serving_size);
      setSelectedIndex(new IndexPath(0)); // Select first item by default
      
      // Set a default amount based on serving size to show nutrition info immediately
      setAmount(defaultServing.serving_size.toString());
      
      // Calculate macros after state updates
      setTimeout(() => {
        if (defaultServing.serving_size > 0) {
          calculateAndDisplayMacros();
        }
      }, 100);
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
          modifiedNutritionInfo.serving_unit = selectedUnit;
        }
        
        // For the nutrition label parsing case, we want to calculate based on number of servings
        // The serving size is already in the unit selected by the user
        // So we can directly calculate how many servings the user's amount represents
        
        // Get the per-serving nutrition values
        const fatPerServing = nutritionInfo.fat_grams_per_serving || 0;
        const carbsPerServing = nutritionInfo.carb_grams_per_serving || 0;
        const proteinPerServing = nutritionInfo.protein_grams_per_serving || 0;
        
        // Calculate number of servings
        const numberOfServings = parsedAmount / (selectedServingSize || 1);
        
        // Calculate the macros
        const calculatedMacros = {
          calories: Math.round(((proteinPerServing * 4) + (carbsPerServing * 4) + (fatPerServing * 9)) * numberOfServings * 10) / 10,
          protein: Math.round(proteinPerServing * numberOfServings * 10) / 10,
          carbs: Math.round(carbsPerServing * numberOfServings * 10) / 10,
          fat: Math.round(fatPerServing * numberOfServings * 10) / 10,
          fiber: 0  // Usually not available from nutrition label
        };
        
        console.log("Calculated macros based on servings:", {
          numberOfServings,
          perServing: {
            protein: proteinPerServing,
            carbs: carbsPerServing,
            fat: fatPerServing
          },
          calculated: calculatedMacros
        });
        
        setCalculatedMacros(calculatedMacros);
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
    if (/^\d*\.?\d*$/.test(value) && parseFloat(value) > 0) {
      // Calculate immediately when amount changes
      setTimeout(calculateAndDisplayMacros, 0); // Use setTimeout to ensure state is updated
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
      
      // For the nutrition label parsing case, we want to calculate based on number of servings
      // Get the per-serving nutrition values
      const fatPerServing = nutritionInfo.fat_grams_per_serving || 0;
      const carbsPerServing = nutritionInfo.carb_grams_per_serving || 0;
      const proteinPerServing = nutritionInfo.protein_grams_per_serving || 0;
      
      // Calculate number of servings
      const numberOfServings = parsedAmount / (selectedServingSize || 1);
      
      // Calculate the macros
      const macros = {
        calories: Math.round(((proteinPerServing * 4) + (carbsPerServing * 4) + (fatPerServing * 9)) * numberOfServings * 10) / 10,
        protein: Math.round(proteinPerServing * numberOfServings * 10) / 10,
        carbs: Math.round(carbsPerServing * numberOfServings * 10) / 10,
        fat: Math.round(fatPerServing * numberOfServings * 10) / 10,
        fiber: 0  // Usually not available from nutrition label
      };
      
      console.log("Calculated macros for submission based on servings:", {
        numberOfServings,
        perServing: {
          protein: proteinPerServing,
          carbs: carbsPerServing,
          fat: fatPerServing
        },
        calculated: macros
      });
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

  // Handle unit selection from UI Kitten Select component
  const handleSelectChange = (index: IndexPath) => {
    if (nutritionInfo.serving_type && nutritionInfo.serving_type.length > index.row) {
      const selectedServing = nutritionInfo.serving_type[index.row];
      setSelectedUnit(selectedServing.serving_unit);
      setSelectedServingSize(selectedServing.serving_size);
      setSelectedIndex(index);
      
      // Recalculate macros immediately if amount is already entered
      if (amount && parseFloat(amount) > 0) {
        // Use setTimeout to ensure state updates are applied first
        setTimeout(calculateAndDisplayMacros, 0);
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
        
        {nutritionInfo.serving_type && nutritionInfo.serving_type.length > 0 ? (
          <Select
            style={styles.unitSelect}
            selectedIndex={selectedIndex}
            onSelect={index => handleSelectChange(index as IndexPath)}
            value={selectedUnit}
            placeholder="Unit"
          >
            {nutritionInfo.serving_type.map((item, index) => (
              <SelectItem key={`unit-${index}`} title={item.serving_unit} />
            ))}
          </Select>
        ) : (
          <Text style={styles.unitText}>{displayUnit}</Text>
        )}
      </View>
      
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
    paddingVertical: 12,
  },
  unitSelect: {
    minWidth: 120,
    marginLeft: 10,
  },
});

export default MacroByLabelCalculator;

