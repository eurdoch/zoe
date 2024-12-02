export interface ProductResponse {
  brand: string;
  categories: string[];
  id: string;
  image: string;
  name: string;
  nutriments: {
    calories: number;
    carbs: string;
    fat: number;
    fiber: number;
    protein: string;
  };
  quantity: null;
}
