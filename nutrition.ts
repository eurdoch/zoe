import NutritionInfo from "./types/NutritionInfo";

type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function calculateMacros(nutrition: NutritionInfo, amountInGrams: number): MacroNutrients {
  // Get serving size weight in grams
  const servingSizeGrams = parseServingSize(nutrition.serving_size || '1 oz (28g)');
  
  // Calculate multiplier based on amount relative to serving size
  const multiplier = amountInGrams / servingSizeGrams;
  
  // Initialize macros
  const macros: MacroNutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };
  
  // Map nutrients to corresponding macro properties
  if (nutrition.nutritional_info) {
    nutrition.nutritional_info.forEach(nutrient => {
    switch(nutrient.name) {
      case 'Calories':
        macros.calories = nutrient.amount_per_serving * multiplier;
        break;
      case 'Protein':
        macros.protein = nutrient.amount_per_serving * multiplier;
        break;
      case 'Total Carbohydrate':
        macros.carbs = nutrient.amount_per_serving * multiplier;
        break;
      case 'Total Fat':
        macros.fat = nutrient.amount_per_serving * multiplier;
        break;
      case 'Fiber':
        macros.fiber = nutrient.amount_per_serving * multiplier;
        break;
    }
    });
  }
  
  // Round values to 1 decimal place
  return {
    calories: Math.round(macros.calories * 10) / 10,
    protein: Math.round(macros.protein * 10) / 10,
    carbs: Math.round(macros.carbs * 10) / 10,
    fat: Math.round(macros.fat * 10) / 10,
    fiber: Math.round(macros.fiber * 10) / 10
  };
}

function parseServingSize(servingSize: string): number {
  // Extract the gram amount from serving size string
  // Example: "2 oz (56g)" -> 56
  const match = servingSize.match(/\((\d+)g\)/);
  if (!match) {
    throw new Error('Invalid serving size format');
  }
  return Number(match[1]);
}

