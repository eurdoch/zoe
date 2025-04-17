import { ProductResponse } from "./types/ProductResponse";

export const transformToProductResponse = (data: any): ProductResponse => {
  // Basic transformation logic to convert from external API format to our ProductResponse type
  return {
    code: data.code || "",
    product: {
      product_name: data.product_name || "",
      brands: data.brands || "",
      image_url: data.image_url || "",
      nutriments: data.nutriments || {},
      serving_size: data.serving_size || "",
      serving_quantity: data.serving_quantity || 0,
      nutrient_levels: data.nutrient_levels || {},
    },
    status: 1,
    status_verbose: "success"
  };
};