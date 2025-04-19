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
  user_id?: string; // Optional for backward compatibility, but will be required in DB
}
