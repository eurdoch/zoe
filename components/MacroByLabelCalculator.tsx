import {useState} from "react";
import {View, TextInput, Button, StyleSheet, Text, ActivityIndicator, TouchableOpacity} from "react-native";
import {calculateMacros} from "../nutrition";
import {postFood} from "../network/food";
import NutritionInfo from "../types/NutritionInfo";
import {showToastError, showToastInfo} from "../utils";

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
  
  // Determine the unit to display based on the nutrition info format
  const displayUnit = nutritionInfo.serving_unit || 'g';

  // Calculate and display macros when amount changes
  const calculateAndDisplayMacros = () => {
    try {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        console.log("Calculating macros with input:", { 
          amount: parsedAmount,
          nutritionInfo: JSON.stringify(nutritionInfo, null, 2)
        });
        
        const macros = calculateMacros(nutritionInfo, parsedAmount);
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
        nutritionInfo: JSON.stringify(nutritionInfo, null, 2)
      });
      
      const macros = calculateMacros(nutritionInfo, parsedAmount);
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
        <Text style={styles.unitText}>{displayUnit}</Text>
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
  },
});

export default MacroByLabelCalculator;

