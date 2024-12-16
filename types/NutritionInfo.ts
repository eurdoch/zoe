interface NutritionData {
  name: string;
  amount_per_serving: number,
  unit: string;
}

export default interface NutritionInfo {
  nutritional_info: NutritionData[], 
  serving_size: string | number;
}
