import Workout from "../types/Workout";
import WorkoutEntry from "../types/WorkoutEntry";
import { API_BASE_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthenticationError } from '../errors/NetworkError';

export async function postWorkout(workout: Workout): Promise<WorkoutEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Create a new workout entry with a unique ID
    const workoutEntry: WorkoutEntry = {
      _id: generateUniqueId(),
      name: workout.name,
      exercises: workout.exercises,
      createdAt: Math.floor(Date.now() / 1000),
    };
    
    // Save the workout to the server
    const response = await fetch(`${API_BASE_URL}/workout`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workoutEntry),
    });
    
    if (!response.ok) {
      console.warn(`Failed to save workout to server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when saving workout to server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to save workout: ${response.status} ${response.statusText}`);
    }
    
    // Return the server response which should include the saved workout
    const savedWorkout = await response.json();
    return savedWorkout;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
}

export async function getWorkout(id: string): Promise<WorkoutEntry | null> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get workout by ID from the server
    const response = await fetch(`${API_BASE_URL}/workout/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // If workout not found, return null instead of throwing an error
      if (response.status === 404) {
        return null;
      }
      
      console.warn(`Failed to get workout by ID: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get workout by ID: ${response.status} ${response.statusText}`);
    }
    
    const workout: WorkoutEntry = await response.json();
    return workout;
  } catch (error) {
    console.error('Error getting workout:', error);
    throw error;
  }
}

export async function getWorkouts(): Promise<WorkoutEntry[]> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Get all workouts from the server
    const response = await fetch(`${API_BASE_URL}/workout`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to get workouts: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to get workouts: ${response.status} ${response.statusText}`);
    }
    
    const workouts: WorkoutEntry[] = await response.json();
    return workouts;
  } catch (error) {
    console.error('Error getting workouts:', error);
    throw error;
  }
}

export async function deleteWorkout(id: string): Promise<void> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Delete the workout from the server
    const response = await fetch(`${API_BASE_URL}/workout/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to delete workout with ID ${id} from server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when deleting workout from server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to delete workout: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

export async function updateWorkout(workoutEntry: WorkoutEntry): Promise<WorkoutEntry> {
  try {
    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new AuthenticationError('Authentication token not found. Please log in again.');
    }
    
    // Prepare the updated entry
    const updatedEntry = {
      _id: workoutEntry._id,
      name: workoutEntry.name,
      exercises: workoutEntry.exercises,
      createdAt: workoutEntry.createdAt || Math.floor(Date.now() / 1000)
    };
    
    // Update the workout on the server
    const response = await fetch(`${API_BASE_URL}/workout`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedEntry)
    });
    
    if (!response.ok) {
      console.warn(`Failed to update workout with ID ${workoutEntry._id} on server: ${response.status} ${response.statusText}`);
      
      // If unauthorized, throw an AuthenticationError
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed when updating workout on server');
        throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
      }
      
      throw new Error(`Failed to update workout: ${response.status} ${response.statusText}`);
    }
    
    // Return the updated workout from the server
    const savedWorkout = await response.json();
    return savedWorkout;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

// Helper function to generate a unique ID
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}