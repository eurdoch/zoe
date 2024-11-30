import Config from "react-native-config";

const headers = {
  'x-app-id': Config.NUTRITIONIX_APP_ID,
  'x-app-key': Config.NUTRITIONIX_API_KEY,
  'x-remote-user-id': '0',  // Use 0 for development
  'Content-Type': 'application/x-www-form-urlencoded'
};

interface NutritionixResponse<T> {
  data: T;
}

async function searchFoodNatural(query: string): Promise<NutritionixResponse<any>> {
  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: query,
        // Optional parameters
        timezone: "US/Eastern",
        locale: "en_US"
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

export const lookupBarcode = async (upc: string): Promise<NutritionixResponse<any>> => {
  try {
    const response = await fetch(`https://trackapi.nutritionix.com/v2/search/item?upc=${upc}`, {
      method: 'GET',
      headers: headers
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

// Example 3: Brand Item Search
//function searchBrandedItems(query: string, limit = 10): Promise<NutritionixResponse<any>> {
  // try {
  //   const response = await fetch('https://trackapi.nutritionix.com/v2/search/instant', {
  //     method: 'GET',
  //     headers: headers,
  //     params: {
  //       query: query,
  //       branded: true,
  //       common: false,
  //       detailed: true,
  //       limit: limit
  //     }
  //   });

  //   if (!response.ok) {
  //     throw new Error(`HTTP error! status: ${response.status}`);
  //   }

  //   const data = await response.json();
  //   return data;
  // } catch (error) {
  //   console.error('Error:', error);
  //   throw error;
  // }
//}
