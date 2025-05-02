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
    // Ensure serving size is a number
    let servingSizeValue: number;
    let servingUnit: string;
    
    // Determine serving size and unit based on availability of serving_type
    if (nutrition.serving_type && nutrition.serving_type.length > 0 && nutrition.serving_size !== undefined) {
      // If we have a specific serving size selected (from dropdown), use that
      servingSizeValue = typeof nutrition.serving_size === 'number' 
        ? nutrition.serving_size 
        : typeof nutrition.serving_size === 'string' 
          ? parseFloat(nutrition.serving_size) 
          : 0;
      
      servingUnit = nutrition.serving_unit || 'g';
    } else if (nutrition.serving_size !== undefined) {
      // Fallback to original serving_size/serving_unit if no serving_type
      servingSizeValue = typeof nutrition.serving_size === 'number' 
        ? nutrition.serving_size 
        : typeof nutrition.serving_size === 'string' 
          ? parseFloat(nutrition.serving_size) 
          : 0;
      
      servingUnit = nutrition.serving_unit || 'g';
    } else {
      // Default values if nothing is provided
      servingSizeValue = 100;
      servingUnit = 'g';
    }
    
    // Convert to grams for common units
    let servingSizeGrams = servingSizeValue;
    if (servingUnit.toLowerCase() === 'oz') {
      servingSizeGrams = servingSizeValue * 28.35; // Convert oz to g
    } else if (servingUnit.toLowerCase() === 'ml') {
      servingSizeGrams = servingSizeValue; // Approximate 1ml = 1g for simplicity
    } else if (servingUnit.toLowerCase() === 'cup') {
      servingSizeGrams = servingSizeValue * 240; // Approximate 1 cup = 240g
    } else if (servingUnit.toLowerCase() === 'tbsp') {
      servingSizeGrams = servingSizeValue * 15; // Approximate 1 tbsp = 15g
    } else if (servingUnit.toLowerCase() === 'tsp') {
      servingSizeGrams = servingSizeValue * 5; // Approximate 1 tsp = 5g
    }
    
    // Calculate number of servings
    const numberOfServings = servingSizeGrams > 0 ? amountInGrams / servingSizeGrams : 1;
    
    // Set macros based on the new format
    const fat = nutrition.fat_grams_per_serving || 0;
    const carbs = nutrition.carb_grams_per_serving || 0;
    const protein = nutrition.protein_grams_per_serving || 0;
    
    // Apply the number of servings to get the actual values for the requested amount
    const adjustedFat = fat * numberOfServings;
    const adjustedCarbs = carbs * numberOfServings;
    const adjustedProtein = protein * numberOfServings;
    
    macros.fat = adjustedFat;
    macros.carbs = adjustedCarbs;
    macros.protein = adjustedProtein;
    
    // Calculate calories using the 4-4-9 rule (4 calories per gram of protein/carbs, 9 calories per gram of fat)
    macros.calories = (adjustedProtein * 4) + (adjustedCarbs * 4) + (adjustedFat * 9);
    
    // Log the values for debugging
    console.log("Nutrition calculation:", {
      fat: adjustedFat,
      carbs: adjustedCarbs,
      protein: adjustedProtein,
      numberOfServings,
      servingSizeValue,
      servingUnit,
      servingSizeGrams,
      amountInGrams,
      calories: macros.calories,
      original: { fat, carbs, protein }
    });
    
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

