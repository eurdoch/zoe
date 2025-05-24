import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ScannedProductData {
  code: string;
  product: {
    brands: string;
    image_url: string;
    nutrient_levels: Record<string, any>;
    nutriments: Record<string, any>;
    product_name: string;
    serving_quantity: number;
    serving_size: string;
  };
  status: number;
  status_verbose: string;
}

interface FoodDataContextType {
  scannedProductData: ScannedProductData | null;
  setScannedProductData: (data: ScannedProductData | null) => void;
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
  const [scannedProductData, setScannedProductData] = useState<ScannedProductData | null>(null);

  const clearFoodData = () => {
    setScannedProductData(null);
  };

  const value = {
    scannedProductData,
    setScannedProductData,
    clearFoodData,
  };

  return (
    <FoodDataContext.Provider value={value}>
      {children}
    </FoodDataContext.Provider>
  );
};
