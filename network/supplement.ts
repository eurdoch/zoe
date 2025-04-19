import Supplement from "../types/Supplement";
import SupplementEntry from "../types/SupplementEntry";
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationError } from '../errors/NetworkError';

export async function postSupplement(supplement: Supplement): Promise<SupplementEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Create a new supplement entry with a unique ID
    const supplementEntry: SupplementEntry = {
      _id: generateUniqueId(),
      ...supplement,
    };
    
    // Save the supplement to the server
    const response = await fetch(`${API_BASE_URL}/supplement`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(supplementEntry),
    });
    
    if (!response.ok) {
      console.warn(`Failed to save supplement to server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when saving supplement to server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to save supplement: ${response.status} ${response.statusText}`);
    }
    
    // Return the server response which should include the saved supplement
    const savedSupplement = await response.json();
    return savedSupplement;
  } catch (error) {
    console.error('Error creating supplement:', error);
    throw error;
  }
}

export async function getSupplementNames(): Promise<string[]> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get all supplements from the server
    const response = await fetch(`${API_BASE_URL}/supplement`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get supplements: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get supplements: ${response.status} ${response.statusText}`);
    }
    
    const supplements: SupplementEntry[] = await response.json();
    
    // Extract unique names
    const uniqueNames = new Set(supplements.map(supplement => supplement.name));
    return Array.from(uniqueNames);
  } catch (error) {
    console.error('Error getting supplement names:', error);
    throw error;
  }
}

export async function getSupplement(startDate?: number, endDate?: number, last_logged?: number): Promise<SupplementEntry[]> {
  try {
    console.log(`👉 getSupplement called with startDate: ${startDate}, endDate: ${endDate}, last_logged: ${last_logged}`);
    
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Construct the URL with query parameters if provided
    let url = `${API_BASE_URL}/supplement`;
    const queryParams = [];
    
    if (startDate !== undefined) {
      queryParams.push(`startDate=${startDate}`);
    }
    
    if (endDate !== undefined) {
      queryParams.push(`endDate=${endDate}`);
    }
    
    if (last_logged !== undefined) {
      queryParams.push(`last_logged=${last_logged}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    // Get supplements from the server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get supplements: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get supplements: ${response.status} ${response.statusText}`);
    }
    
    const supplements: SupplementEntry[] = await response.json();
    console.log(`👉 Received ${supplements.length} supplements from server`);
    return supplements;
  } catch (error) {
    console.error('Error getting supplements:', error);
    throw error;
  }
}

export async function getSupplementById(id: string): Promise<SupplementEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get supplement by ID from the server
    const response = await fetch(`${API_BASE_URL}/supplement/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get supplement by ID: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get supplement by ID: ${response.status} ${response.statusText}`);
    }
    
    const supplement: SupplementEntry = await response.json();
    
    if (!supplement) {
      throw new Error(`Supplement with id ${id} not found`);
    }
    
    return supplement;
  } catch (error) {
    console.error('Error getting supplement by id:', error);
    throw error;
  }
}

export async function deleteSupplement(id: string): Promise<void> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Delete the supplement from the server
    const response = await fetch(`${API_BASE_URL}/supplement/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to delete supplement with ID ${id} from server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when deleting supplement from server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to delete supplement: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting supplement:', error);
    throw error;
  }
}

// Helper function to generate a unique ID
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}