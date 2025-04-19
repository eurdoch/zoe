// Legacy interface - keeping for backward compatibility
interface OldProductResponse {
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
  quantity: null;
}

// Updated interface structure aligned with the API response
export interface ProductResponse {
  code: string;
  product: {
    product_name: string;
    brands: string;
    image_url: string;
    nutriments: {
      'energy-kcal_100g'?: number;
      'carbohydrates_100g'?: number;
      'fat_100g'?: number;
      'fiber_100g'?: number;
      'proteins_100g'?: number;
      // Adding fallbacks for various naming conventions
      'energy-kcal'?: number;
      'energy_kcal'?: number;
      'energy_100g'?: number;
      'energy'?: number;
      'carbohydrates'?: number;
      'carbs'?: number;
      'carbs_100g'?: number;
      'fat'?: number;
      'fibers'?: number;
      'fibers_100g'?: number;
      'proteins'?: number;
    };
    serving_size: string;
    serving_quantity: number;
    nutrient_levels: any;
  };
  status: number;
  status_verbose: string;
}

// Export the legacy type as default for backward compatibility
export default OldProductResponse;