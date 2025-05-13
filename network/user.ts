import { getApiBaseUrl } from '../config';
import { AuthenticationError } from '../errors/NetworkError';
import User from '../types/User';

/**
 * Fetches user information using the provided token
 * @param token JWT authentication token
 * @returns User object if successful
 * @throws AuthenticationError if token is invalid (401/403 status)
 */
export async function getUser(token: string): Promise<User> {
  try {
    if (!token) {
      throw new AuthenticationError('Authentication token not provided');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/verify/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get user information: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get user information: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error getting user information:', error);
    throw error;
  }
}

/**
 * Updates the user's premium status in the backend
 * @param token JWT authentication token
 * @param receiptData The purchase receipt data from the app store
 * @param platform 'ios' or 'android' to indicate which platform the purchase was made on
 * @returns Updated User object with premium status if successful
 * @throws AuthenticationError if token is invalid (401/403 status)
 */
export async function updatePremiumStatus(
  token: string, 
  receiptData: string, 
  platform: 'ios' | 'android'
): Promise<User> {
  try {
    if (!token) {
      throw new AuthenticationError('Authentication token not provided');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/verify/premium`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receipt: receiptData,
        platform: platform,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      console.warn(`Failed to update premium status: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to update premium status: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating premium status:', error);
    throw error;
  }
}

/**
 * Updates user information including daily calorie goal
 * @param token JWT authentication token
 * @param userData Object containing user data to update
 * @returns Updated User object if successful
 * @throws AuthenticationError if token is invalid (401/403 status)
 */
export async function updateUserInfo(
  token: string,
  userData: { daily_calories?: number, name?: string, email?: string }
): Promise<User> {
  try {
    if (!token) {
      throw new AuthenticationError('Authentication token not provided');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/user`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      console.warn(`Failed to update user information: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to update user information: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating user information:', error);
    throw error;
  }
}