import { ProductResponse } from "./types/ProductResponse";

export const transformToProductResponse = (data: any): ProductResponse => {
  // Check if data already has expected structure
  if (data.product && data.code) {
    // Data is already in the expected format, but ensure product properties are correctly mapped
    return {
      code: data.code,
      product: {
        product_name: data.product.product_name || data.product.name || "",
        brands: data.product.brands || data.product.brand || "",
        image_url: data.product.image_url || data.product.image || "",
        nutriments: data.product.raw_data?.nutriments || data.product.nutriments || data.product.nutrition_facts || {
          // Map any legacy nutriments data if present
          'energy-kcal_100g': data.product.calories,
          'proteins_100g': data.product.protein,
          'carbohydrates_100g': data.product.carbs,
          'fat_100g': data.product.fat,
          'fiber_100g': data.product.fiber
        },
        serving_size: data.product.serving_size || "",
        serving_quantity: data.product.serving_quantity || 0,
        nutrient_levels: data.product.nutrient_levels || {},
      },
      status: 1,
      status_verbose: "success"
    };
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