interface OpenFoodFactsNutriments {
  'energy-kcal_100g': number;
  carbohydrates_100g: number;
  fat_100g: number;
  fiber_100g: number;
  proteins_100g: number;
  [key: string]: any;  // Allow other nutriment properties
}

interface OpenFoodFactsResponse {
  brands: string;
  categories_tags: string[];
  code: string;
  image_url: string;
  product_name: string;
  nutriments: OpenFoodFactsNutriments;
  quantity?: string | null;
  status: number;
  status_verbose: string;
}

interface ProductResponse {
  brand: string;
  categories: string[];
  id: string;
  image: string;
  name: string;
  nutriments: {
    calories: number;
    carbs: number;
    fat: number;
    fiber: number;
    protein: number;
  };
  quantity: string | null;
}

/**
 * Transforms Open Food Facts API response to ProductResponse format
 * @param apiResponse - Response from Open Food Facts API
 * @returns Transformed product response
 */
export function transformToProductResponse(apiResponse: OpenFoodFactsResponse): ProductResponse {
  return {
    brand: apiResponse.brands,
    categories: apiResponse.categories_tags.map(cat => cat.replace('en:', '')),
    id: apiResponse.code,
    image: apiResponse.image_url,
    name: apiResponse.product_name,
    nutriments: {
      calories: apiResponse.nutriments['energy-kcal_100g'] || 0,
      carbs: apiResponse.nutriments.carbohydrates_100g || 0,
      fat: apiResponse.nutriments.fat_100g || 0,
      fiber: apiResponse.nutriments.fiber_100g || 0,
      protein: apiResponse.nutriments.proteins_100g || 0
    },
    quantity: apiResponse.quantity || null
  };
}
