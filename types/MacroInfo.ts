export default interface MacroInfo {
  productName: string;
  servingSize: string | null;
  brand: string | null;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}
