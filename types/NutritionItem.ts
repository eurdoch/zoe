export default interface NutritionItem {
  alt_measures: null;
  brand_name: string;
  brick_code: null;
  class_code: null;
  food_name: string;
  full_nutrients: Array<any>; // You might want to define a more specific type for nutrients
  lat: null;
  lng: null;
  metadata: Record<string, any>; // You might want to define a more specific type for metadata
  ndb_no: null;
  nf_calories: number;
  nf_cholesterol: number;
  nf_dietary_fiber: number;
  nf_ingredient_statement: null;
  nf_metric_qty: null;
  nf_metric_uom: null;
  nf_p: null;
  nf_potassium: null;
  nf_protein: number;
  nf_saturated_fat: number;
  nf_sodium: number;
  nf_sugars: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
  nix_brand_id: string;
  nix_brand_name: string;
  nix_item_id: string;
  nix_item_name: string;
  note: null;
  photo?: Record<string, any>; // You might want to define a more specific type for photo
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number;
  source: number;
  tag_id: null;
  updated_at: string;
}

// Optional: More specific types for nested objects
interface NutrientInfo {
  attr_id: number;
  value: number;
}

interface PhotoInfo {
  thumb: string;
  highres?: string;
  is_user_uploaded?: boolean;
}

interface MetadataInfo {
  // Add specific metadata fields here
}
 
