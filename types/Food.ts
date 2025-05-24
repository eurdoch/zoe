export default interface Food {
  brand?: string;
  categories?: string[];
  name: string;
  macros: {
    calories: number;
    carbs: number;
    fat: number;
    fiber?: number;
    protein: number;
  };
  createdAt: number;
  user_id: string;
}
