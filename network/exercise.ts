import { Realm } from '@realm/react';
import Exercise from "../types/Exercise";
import ExerciseEntry from "../types/ExerciseEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function postExercise(exercise: Exercise, realm: Realm): Promise<ExerciseEntry> {
  try {
    let result: ExerciseEntry;
    
    // Create in local Realm database
    realm.write(() => {
      const exerciseEntry = {
        _id: new Realm.BSON.ObjectId().toString(),
        ...exercise,
      };
      result = realm.create('ExerciseEntry', exerciseEntry);
    });
    
    return result!;
  } catch (error) {
    console.error('Error creating exercise:', error);
    throw error;
  }
}

export async function getExerciseNames(realm: Realm): Promise<string[]> {
  try {
    const exercises = realm.objects<ExerciseEntry>('ExerciseEntry');
    const uniqueNames = new Set(exercises.map(exercise => exercise.name));
    return Array.from(uniqueNames);
  } catch (error) {
    console.error('Error getting exercise names:', error);
    throw error;
  }
}

export async function getExerciseDataByName(name: string, realm: Realm): Promise<ExerciseEntry[]> {
  try {
    const exercises = realm.objects<ExerciseEntry>('ExerciseEntry')
      .filtered('name == $0', name);
    return Array.from(exercises).map(exercise => ({ ...exercise }));
  } catch (error) {
    console.error('Error getting exercise data by name:', error);
    throw error;
  }
}

export async function getExerciseById(id: string, realm: Realm): Promise<ExerciseEntry> {
  try {
    const exercise = realm.objectForPrimaryKey<ExerciseEntry>('ExerciseEntry', id);
    if (!exercise) {
      throw new Error(`Exercise with id ${id} not found`);
    }
    return { ...exercise };
  } catch (error) {
    console.error('Error getting exercise by id:', error);
    throw error;
  }
}

export async function deleteExerciseById(id: string, realm: Realm): Promise<void> {
  try {
    // Delete from local Realm database
    realm.write(() => {
      const exercise = realm.objectForPrimaryKey<ExerciseEntry>('ExerciseEntry', id);
      if (exercise) {
        realm.delete(exercise);
      }
    });
    
    // If sync is enabled, delete from the remote server as well
    if (SYNC_ENABLED) {
      try {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found, skipping server deletion');
          return;
        }
        
        // Delete the exercise from the server with authentication
        const response = await fetch(`${API_BASE_URL}/exercise/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          console.warn(`Failed to delete exercise with ID ${id} from server: ${response.status} ${response.statusText}`);
          
          // If unauthorized, log it specifically
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed when deleting exercise from server');
          }
        } else {
          console.log(`Successfully deleted exercise with ID ${id} from server`);
        }
      } catch (syncError) {
        console.warn(`Failed to sync deletion of exercise with ID ${id}:`, syncError);
        // This doesn't affect the local deletion, it just means we'll have inconsistency with the server
      }
    }
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
}

