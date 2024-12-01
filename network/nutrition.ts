import Config from "react-native-config";

const headers = {
  'x-app-id': Config.NUTRITIONIX_APP_ID,
  'x-app-key': Config.NUTRITIONIX_API_KEY,
  'x-remote-user-id': '0',  // Use 0 for development
  "Content-Type": "application/json",
};

export async function searchFoodNatural(query: string): Promise<any> {
  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: query,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export const getNutritionInfo = async (upc: string): Promise<any[]> => {
  try {
    const response = await fetch(`https://trackapi.nutritionix.com/v2/search/item?upc=${upc}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.foods || data.foods.length === 0) {
      throw new Error('Product not found');
    }

    const food = data.foods[0];
    
    return {
      productName: food.food_name,
      brandName: food.brand_name,
      servingSize: {
        quantity: food.serving_qty,
        unit: food.serving_unit,
        grams: food.serving_weight_grams
      },
      calories: {
        perServing: food.nf_calories,
        per100g: (food.nf_calories / food.serving_weight_grams) * 100
      },
      nutrients: {
        totalFat: food.nf_total_fat,
        saturatedFat: food.nf_saturated_fat,
        cholesterol: food.nf_cholesterol,
        sodium: food.nf_sodium,
        totalCarbs: food.nf_total_carbohydrate,
        dietaryFiber: food.nf_dietary_fiber,
        sugars: food.nf_sugars,
        protein: food.nf_protein
      }
    };
  } catch (error) {
    console.error('Error fetching nutrition info:', error);
    throw error;
  }
};

// Function to calculate calories for a specific number of servings
const calculateCalories = (nutritionInfo, numberOfServings) => {
  return {
    totalCalories: nutritionInfo.calories.perServing * numberOfServings,
    servingInfo: {
      original: nutritionInfo.servingSize,
      requested: {
        quantity: nutritionInfo.servingSize.quantity * numberOfServings,
        unit: nutritionInfo.servingSize.unit,
        grams: nutritionInfo.servingSize.grams * numberOfServings
      }
    }
  };
};

export async function searchFoodItems(query: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({ query });
    const response = await fetch(`https://trackapi.nutritionix.com/v2/search/instant?${params.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getFoodItemByNixItemId(nixItemId: string): Promise<any> {
  try {
    const response = await fetch(`https://trackapi.nutritionix.com/v2/search/item?nix_item_id=${nixItemId}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data['foods'][0];
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
