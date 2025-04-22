import React, { createContext, useContext, useState, ReactNode } from 'react';
import NutritionInfo from '../types/NutritionInfo';
import { ProductResponse } from '../types/ProductResponse';

// Type for food image analysis results
export interface FoodImageAnalysisResult {
  food_name: string;
  calories: number;
  protein_grams: number;
  carb_grams: number;
  fat_grams: number;
  confidence: string;
}

interface FoodDataContextType {
  nutritionInfo: NutritionInfo | null;
  scannedProduct: ProductResponse | null;
  foodImageAnalysis: FoodImageAnalysisResult | null;
  setNutritionInfo: (info: NutritionInfo | null) => void;
  setScannedProduct: (product: ProductResponse | null) => void;
  setFoodImageAnalysis: (result: FoodImageAnalysisResult | null) => void;
  clearFoodData: () => void;
}

const FoodDataContext = createContext<FoodDataContextType | null>(null);

export const useFoodData = (): FoodDataContextType => {
  const context = useContext(FoodDataContext);
  if (!context) {
    throw new Error('useFoodData must be used within a FoodDataProvider');
  }
  return context;
};

interface FoodDataProviderProps {
  children: ReactNode;
}

export const FoodDataProvider: React.FC<FoodDataProviderProps> = ({ children }) => {
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ProductResponse | null>(null);
  const [foodImageAnalysis, setFoodImageAnalysis] = useState<FoodImageAnalysisResult | null>(null);

  const clearFoodData = () => {
    setNutritionInfo(null);
    setScannedProduct(null);
    setFoodImageAnalysis(null);
  };

  const value = {
    nutritionInfo,
    scannedProduct,
    foodImageAnalysis,
    setNutritionInfo,
    setScannedProduct,
    setFoodImageAnalysis,
    clearFoodData,
  };

  return (
    <FoodDataContext.Provider value={value}>
      {children}
    </FoodDataContext.Provider>
  );
};