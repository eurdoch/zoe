export default interface Food {
  brand: string;
  categories: string[];
  id: string;
  name: string;
  macros: {
    calories: number;
    carbs: number;
    fat: number;
    fiber: number;
    protein: number;
  };
  createdAt: number;
}
