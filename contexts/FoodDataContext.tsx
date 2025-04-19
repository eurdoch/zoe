import React, { createContext, useContext, useState, ReactNode } from 'react';
import NutritionInfo from '../types/NutritionInfo';
import { ProductResponse } from '../types/ProductResponse';

interface FoodDataContextType {
  nutritionInfo: NutritionInfo | null;
  scannedProduct: ProductResponse | null;
  setNutritionInfo: (info: NutritionInfo | null) => void;
  setScannedProduct: (product: ProductResponse | null) => void;
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

  const clearFoodData = () => {
    setNutritionInfo(null);
    setScannedProduct(null);
  };

  const value = {
    nutritionInfo,
    scannedProduct,
    setNutritionInfo,
    setScannedProduct,
    clearFoodData,
  };

  return (
    <FoodDataContext.Provider value={value}>
      {children}
    </FoodDataContext.Provider>
  );
};