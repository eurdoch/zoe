import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { showToastInfo } from '../utils';

interface MacroByImageAnalysisProps {
  analysisResult: {
    food_name: string;
    calories: number;
    protein_grams: number;
    carb_grams: number;
    fat_grams: number;
    confidence: string;
  };
  onConfirm: () => void;
}

const MacroByImageAnalysis = ({ analysisResult, onConfirm }: MacroByImageAnalysisProps) => {
  const [foodName, setFoodName] = useState(analysisResult.food_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    
    // Just log the information for now
    console.log('Food entry from image analysis confirmed:', {
      name: foodName,
      calories: analysisResult.calories,
      protein: analysisResult.protein_grams,
      carbs: analysisResult.carb_grams,
      fat: analysisResult.fat_grams,
      confidence: analysisResult.confidence
    });
    
    showToastInfo(`Added ${foodName} to your food log`);
    
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirm();
    }, 500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Food Analysis</Text>
      <Text style={styles.subtitle}>
        Based on your photo, our AI estimates the following:
      </Text>
      
      <TextInput
        style={styles.nameInput}
        value={foodName}
        onChangeText={setFoodName}
        placeholder="Food name"
        placeholderTextColor="#999"
      />
      
      <View style={styles.infoContainer}>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Calories:</Text>
          <Text style={styles.macroValue}>{analysisResult.calories}</Text>
        </View>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Protein:</Text>
          <Text style={styles.macroValue}>{analysisResult.protein_grams}g</Text>
        </View>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Carbs:</Text>
          <Text style={styles.macroValue}>{analysisResult.carb_grams}g</Text>
        </View>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Fat:</Text>
          <Text style={styles.macroValue}>{analysisResult.fat_grams}g</Text>
        </View>
      </View>
      
      <Text style={styles.confidenceText}>
        Confidence: <Text style={
          analysisResult.confidence === 'low' ? styles.confidence_low :
          analysisResult.confidence === 'medium' ? styles.confidence_medium :
          analysisResult.confidence === 'high' ? styles.confidence_high :
          {}
        }>{analysisResult.confidence}</Text>
      </Text>
      
      <Text style={styles.disclaimer}>
        This is an AI estimate and may not be completely accurate.
      </Text>
      
      {isSubmitting ? (
        <View style={styles.confirmButton}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm & Add</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  macroLabel: {
    fontSize: 16,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  confidence_low: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  confidence_medium: {
    color: '#f39c12',
    fontWeight: 'bold',
  },
  confidence_high: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MacroByImageAnalysis;