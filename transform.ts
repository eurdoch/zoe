import { ProductResponse } from "./types/ProductResponse";

export const transformToProductResponse = (data: any): ProductResponse => {
  // Check if data already has expected structure
  if (data.product && data.code) {
    // Data is already in the expected format
    return data as ProductResponse;
  }
  
  // Basic transformation logic to convert from external API format to our ProductResponse type
  return {
    code: data.code || data.id || "",
    product: {
      product_name: data.product_name || data.name || "",
      brands: data.brands || data.brand || "",
      image_url: data.image_url || data.image || "",
      nutriments: data.nutriments || {
        // Map any legacy nutriments data if present
        'energy-kcal_100g': data.calories,
        'proteins_100g': data.protein,
        'carbohydrates_100g': data.carbs,
        'fat_100g': data.fat,
        'fiber_100g': data.fiber
      },
      serving_size: data.serving_size || "",
      serving_quantity: data.serving_quantity || 0,
      nutrient_levels: data.nutrient_levels || {},
    },
    status: 1,
    status_verbose: "success"
  };
};