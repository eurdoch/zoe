import Weight from "../types/Weight";
import WeightEntry from "../types/WeightEntry";
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationError } from '../errors/NetworkError';

export async function postWeight(weight: Weight): Promise<WeightEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Create a new weight entry with a unique ID
    const weightEntry: WeightEntry = {
      _id: generateUniqueId(),
      value: weight.value,
      createdAt: weight.createdAt,
    };
    
    // Save the weight to the server
    const response = await fetch(`${API_BASE_URL}/weight`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(weightEntry),
    });
    
    if (!response.ok) {
      console.warn(`Failed to save weight to server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when saving weight to server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to save weight: ${response.status} ${response.statusText}`);
    }
    
    // Return the server response which should include the saved weight
    const savedWeight = await response.json();
    return savedWeight;
  } catch (error) {
    console.error('Error creating weight:', error);
    throw error;
  }
}

export async function getWeight(startDate?: number, endDate?: number): Promise<WeightEntry[]> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Construct the URL with query parameters if provided
    let url = `${API_BASE_URL}/weight`;
    const queryParams = [];
    
    if (startDate !== undefined) {
      queryParams.push(`startDate=${startDate}`);
    }
    
    if (endDate !== undefined) {
      queryParams.push(`endDate=${endDate}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    // Get weight entries from the server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get weight entries: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get weight entries: ${response.status} ${response.statusText}`);
    }
    
    const weights: WeightEntry[] = await response.json();
    return weights;
  } catch (error) {
    console.error('Error getting weight entries:', error);
    throw error;
  }
}

export async function deleteWeight(id: string): Promise<void> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Delete the weight from the server
    const response = await fetch(`${API_BASE_URL}/weight/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to delete weight with ID ${id} from server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when deleting weight from server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to delete weight: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting weight:', error);
    throw error;
  }
}

// Helper function to generate a unique ID
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}