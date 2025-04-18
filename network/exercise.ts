import Exercise from "../types/Exercise";
import ExerciseEntry from "../types/ExerciseEntry";
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationError } from '../errors/NetworkError';

export async function postExercise(exercise: Exercise): Promise<ExerciseEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Create a new exercise entry with unique ID
    const exerciseEntry: ExerciseEntry = {
      _id: generateUniqueId(),
      ...exercise,
    };
    
    // Save the exercise to the server with authentication
    const response = await fetch(`${API_BASE_URL}/exercise`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(exerciseEntry),
    });
    
    if (!response.ok) {
      console.warn(`Failed to save exercise to server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when saving exercise to server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to save exercise: ${response.status} ${response.statusText}`);
    }
    
    // Return the server response which should include the saved exercise
    const savedExercise = await response.json();
    return savedExercise;
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw error;
  }
}

export async function getExerciseNames(): Promise<string[]> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get all exercises from the server
    const response = await fetch(`${API_BASE_URL}/exercise`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get exercises: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get exercises: ${response.status} ${response.statusText}`);
    }
    
    const exercises: ExerciseEntry[] = await response.json();
    
    // Extract unique names
    const uniqueNames = new Set(exercises.map(exercise => exercise.name));
    return Array.from(uniqueNames);
  } catch (error) {
    console.error('Error getting exercise names:', error);
    throw error;
  }
}

export async function getExerciseDataByName(name: string): Promise<ExerciseEntry[]> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get all exercises from the server
    console.log('URI: ', `${API_BASE_URL}/exercise?name=${encodeURIComponent(name)}`);
    const response = await fetch(`${API_BASE_URL}/exercise?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get exercises by name: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get exercises by name: ${response.status} ${response.statusText}`);
    }
    
    // Return the filtered exercises
    const exercises: ExerciseEntry[] = await response.json();
    return exercises;
  } catch (error) {
    console.error('Error getting exercise data by name:', error);
    throw error;
  }
}

export async function getExerciseById(id: string): Promise<ExerciseEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get exercise by ID from the server
    const response = await fetch(`${API_BASE_URL}/exercise/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get exercise by ID: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get exercise by ID: ${response.status} ${response.statusText}`);
    }
    
    const exercise: ExerciseEntry = await response.json();
    
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }
    
    return exercise;
  } catch (error) {
    console.error('Error getting exercise by id:', error);
    throw error;
  }
}

export async function deleteExerciseById(id: string): Promise<void> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Delete the exercise from the server
    const response = await fetch(`${API_BASE_URL}/exercise/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to delete exercise with ID ${id} from server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when deleting exercise from server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to delete exercise: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
}

// Helper function to generate a unique ID (since we no longer have Realm.BSON.ObjectId)
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
