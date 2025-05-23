export default interface NutritionInfo {
  // Common properties
  serving_unit?: string;
  
  // New format properties
  serving_size?: number | string;  // Can be number or string depending on format
  fat_grams_per_serving?: number;
  carb_grams_per_serving?: number;
  protein_grams_per_serving?: number;
  
  // Serving types array (new structure)
  serving_type?: Array<{
    serving_size: number;
    serving_unit: string;
  }>;
  
  // Legacy format properties
  nutritional_info?: Array<{
    name: string;
    amount_per_serving: number;
    unit: string;
  }>;
}
