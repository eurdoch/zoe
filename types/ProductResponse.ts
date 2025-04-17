// Legacy interface
export default interface OldProductResponse {
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

// New interface structure aligned with the external API
export interface ProductResponse {
  code: string;
  product: {
    product_name: string;
    brands: string;
    image_url: string;
    nutriments: any;
    serving_size: string;
    serving_quantity: number;
    nutrient_levels: any;
  };
  status: number;
  status_verbose: string;
}