export const getFoodItemByUpc = async (upc: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${upc}.json`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching nutrition info:', error);
    throw error;
  }
};

/**
 * Search for products in Open Food Facts database by name
 * @param {string} searchQuery - Product name to search for
 * @param {Object} options - Search options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Results per page (default: 24)
 * @param {string} options.locale - Locale for results (default: 'world')
 * @returns {Promise<Object>} Search results with products and pagination info
 */
export const searchFoodItemByText = async (searchQuery: string, options = {}) => {
  const {
    page = 1,
    pageSize = 24,
    locale = 'world'
  } = options;

  // Encode the search query for URL
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Construct the search URL
  const url = `https://${locale}.openfoodfacts.org/cgi/search.pl?` + 
    `search_terms=${encodedQuery}&` +
    `search_simple=1&` +
    `action=process&` +
    `json=true&` +
    `page=${page}&` +
    `page_size=${pageSize}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the response into a more friendly format
    return {
      count: data.count,
      page: data.page,
      pageSize: data.page_size,
      totalPages: Math.ceil(data.count / data.page_size),
      products: data.products.map(product => ({
        id: product._id,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || null,
        image: product.image_url || null,
        quantity: product.quantity || null,
        categories: product.categories_tags || [],
        nutriments: {
          calories: product.nutriments['energy-kcal_100g'] || 0,
          protein: product.nutriments.proteins_100g || 0,
          carbs: product.nutriments.carbohydrates_100g || 0,
          fat: product.nutriments.fat_100g || 0,
          fiber: product.nutriments.fiber_100g || 0
        }
      }))
    };
  } catch (error) {
    throw new Error(
      `Failed to search products: ${error.message}`
    );
  }
}

interface Nutrients {
  carbohydrates_100g: number;
  proteins_100g: number;
  fat_100g: number;
  'energy-kcal_100g': number;
  fiber_100g: number;
}

interface ProductResponse {
  status: number;
  product: {
    product_name: string;
    nutriments: Nutrients;
    serving_size?: string;
    brands?: string;
  };
}

interface MacroInfo {
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

class ProductNotFoundError extends Error {
  constructor(upc: string) {
    super(`Product not found for UPC: ${upc}`);
    this.name = 'ProductNotFoundError';
  }
}

/**
 * Fetches macro nutritional information for a given UPC barcode from Open Food Facts API
 * @param upc - The UPC barcode number
 * @returns Promise containing the macro nutritional information
 * @throws {ProductNotFoundError} When the product is not found
 * @throws {Error} When there's an API error or network issue
 */
export async function getMacros(upc: string): Promise<MacroInfo> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${upc}.json`
    );

    console.log(response);
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json() as ProductResponse;

    if (data.status !== 1) {
      throw new ProductNotFoundError(upc);
    }

    const { product } = data;
    const { nutriments } = product;

    return {
      productName: product.product_name || 'Unknown Product',
      servingSize: product.serving_size || null,
      brand: product.brands || null,
      macros: {
        calories: Math.round(nutriments['energy-kcal_100g'] * 100) / 100,
        protein: Math.round(nutriments.proteins_100g * 100) / 100,
        carbs: Math.round(nutriments.carbohydrates_100g * 100) / 100,
        fat: Math.round(nutriments.fat_100g * 100) / 100,
        fiber: Math.round(nutriments.fiber_100g * 100) / 100,
      },
    };
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      throw error;
    }
    throw new Error(
      `Failed to fetch product information: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
