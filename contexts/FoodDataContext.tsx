import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FoodDataContextType {
  foodData: string;
  setFoodData: (data: string) => void;
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
  const [foodData, setFoodData] = useState<string>('');

  const clearFoodData = () => {
    setFoodData('');
  };

  const value = {
    foodData,
    setFoodData,
    clearFoodData,
  };

  return (
    <FoodDataContext.Provider value={value}>
      {children}
    </FoodDataContext.Provider>
  );
};
