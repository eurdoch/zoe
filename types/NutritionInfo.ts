import NutritionData from "./NutritionData";

export default interface NutritionInfo {
  nutritional_info: NutritionData[], 
  serving_size: string;
}
