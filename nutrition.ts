import NutritionInfo from "./types/NutritionInfo";

type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function calculateMacros(nutrition: NutritionInfo, amountInGrams: number): MacroNutrients {
  // Initialize macros
  const macros: MacroNutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };
  
  // Check which format we're using (new or legacy)
  const isNewFormat = typeof nutrition.fat_grams_per_serving === 'number';
  
  if (isNewFormat) {
    // New format processing
    // Calculate calories (rough estimate if not available)
    // Ensure serving size is a number
    const servingSizeValue = typeof nutrition.serving_size === 'number' 
      ? nutrition.serving_size 
      : typeof nutrition.serving_size === 'string' 
        ? parseFloat(nutrition.serving_size) 
        : 0;
        
    let servingUnit = nutrition.serving_unit || 'g';
    
    // Convert serving size to grams if needed
    let servingSizeGrams = servingSizeValue;
    if (servingUnit === 'oz') {
      servingSizeGrams = servingSizeValue * 28.35; // Convert oz to g
    }
    
    // Calculate multiplier based on amount relative to serving size
    const multiplier = servingSizeGrams > 0 ? amountInGrams / servingSizeGrams : 1;
    
    // Set macros based on the new format
    const fat = nutrition.fat_grams_per_serving || 0;
    const carbs = nutrition.carb_grams_per_serving || 0;
    const protein = nutrition.protein_grams_per_serving || 0;
    
    macros.fat = fat * multiplier;
    macros.carbs = carbs * multiplier;
    macros.protein = protein * multiplier;
    // Estimate calories based on macronutrients (4-4-9 rule)
    macros.calories = (protein * 4 + carbs * 4 + fat * 9) * multiplier;
    // Not available in new format, default to 0
    macros.fiber = 0;
  } else {
    // Legacy format processing
    // Get serving size weight in grams
    const servingSizeStr = typeof nutrition.serving_size === 'string' 
      ? nutrition.serving_size 
      : '1 oz (28g)';
    const servingSizeGrams = parseServingSize(servingSizeStr);
    
    // Calculate multiplier based on amount relative to serving size
    const multiplier = amountInGrams / servingSizeGrams;
    
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
    // Return a default value if we can't parse
    return 28; // Default to 28g (1 oz) if unparseable
  }
  return Number(match[1]);
}

