export default interface MacrosByServing {
  servingInfo: {
    amount: number;
    unit: string;
    originalServingSize: string | null;
  };
  product: {
    name: string;
    brand: string | null;
  };
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}
