import FoodEntry from "../types/FoodEntry";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config';
import { AuthenticationError } from '../errors/NetworkError';
import Food from "../types/Food";

export async function postFood(food: Food): Promise<any> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(food),
    });
    
    if (!response.ok) {
      console.warn(`Failed to post food: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to post food: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error posting food:', error);
    throw error;
  }
}

export async function getFood(id: string): Promise<FoodEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/food/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get food with ID ${id}: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get food: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error getting food:', error);
    throw error;
  }
}

export async function deleteFood(id: string): Promise<any> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/food/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to delete food with ID ${id}: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to delete food: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
}

export async function getFoodByUnixTime(unixTime: number): Promise<FoodEntry[]> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/food?unixTime=${unixTime}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get food by Unix time ${unixTime}: ${response.status} ${response.statusText}`);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get food by Unix time: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error getting food by Unix time:', error);
    throw error;
  }
}
