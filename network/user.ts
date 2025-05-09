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