export default interface ProductResponse {
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
