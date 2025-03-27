import { Realm } from '@realm/react';
import Workout from "../types/Workout";
import WorkoutEntry from "../types/WorkoutEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function postWorkout(workout: Workout, realm: Realm): Promise<WorkoutEntry> {
  try {
    let result: WorkoutEntry;
    
    realm.write(() => {
      const createdAt = Date.now()
      const workoutEntry = {
        _id: new Realm.BSON.ObjectId().toString(),
        name: workout.name,
        exercises: workout.exercises,
        createdAt: Math.floor(Date.now() / 1000),
      };
      result = realm.create<WorkoutEntry>('WorkoutEntry', workoutEntry);
    });
    
    return result!;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
}

export async function getWorkout(id: string, realm: Realm): Promise<WorkoutEntry | null> {
  try {
    const workoutEntry = realm.objectForPrimaryKey<WorkoutEntry>('WorkoutEntry', id);
    if (!workoutEntry) return null;
    return {
      _id: workoutEntry._id,
      name: workoutEntry.name,
      exercises: [...workoutEntry.exercises],
      createdAt: workoutEntry.createdAt,
    };
  } catch (error) {
    console.error('Error getting workout:', error);
    throw error;
  }
}

export async function getWorkouts(realm: Realm): Promise<WorkoutEntry[]> {
  try {
    const workouts = realm.objects<WorkoutEntry>('WorkoutEntry');
    return Array.from(workouts).map(workout => ({
      _id: workout._id,
      name: workout.name,
      exercises: [...workout.exercises],
      createdAt: workout.createdAt,
    }));
  } catch (error) {
    console.error('Error getting workouts:', error);
    throw error;
  }
}

export async function deleteWorkout(id: string, realm: Realm): Promise<void> {
  try {
    // Delete from local Realm database
    realm.write(() => {
      const workoutEntry = realm.objectForPrimaryKey<WorkoutEntry>('WorkoutEntry', id);
      if (workoutEntry) {
        realm.delete(workoutEntry);
      }
    });
    
    // If sync is enabled, delete from the remote server as well
    if (SYNC_ENABLED) {
      try {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found, skipping server deletion for workout');
          return;
        }
        
        // Delete the workout from the server with authentication
        const response = await fetch(`${API_BASE_URL}/workout/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        if (!response.ok) {
          console.warn(`Failed to delete workout with ID ${id} from server: ${response.status} ${response.statusText}`);
          
          // If unauthorized, log it specifically
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed when deleting workout from server');
          }
        } else {
          console.log(`Successfully deleted workout with ID ${id} from server`);
        }
      } catch (syncError) {
        console.warn(`Failed to sync deletion of workout with ID ${id}:`, syncError);
        // This doesn't affect the local deletion, it just means we'll have inconsistency with the server
      }
    }
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

export async function updateWorkout(workoutEntry: WorkoutEntry, realm: Realm): Promise<WorkoutEntry> {
  try {
    // Update in local Realm database
    const updatedEntry = {
      _id: workoutEntry._id,
      name: workoutEntry.name,
      exercises: workoutEntry.exercises,
      createdAt: Math.floor(Date.now() / 1000)
    };
    
    realm.write(() => {
      realm.create<WorkoutEntry>(
        'WorkoutEntry',
        updatedEntry,
        Realm.UpdateMode.Modified,
      );
    });
    
    // If sync is enabled, update on the remote server as well
    if (SYNC_ENABLED) {
      try {
        // Get JWT token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('No authentication token found, skipping server update for workout');
          return workoutEntry;
        }
        
        // Update the workout on the server with authentication
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
          
          // If unauthorized, log it specifically
          if (response.status === 401 || response.status === 403) {
            console.error('Authentication failed when updating workout on server');
          }
        } else {
          console.log(`Successfully updated workout with ID ${workoutEntry._id} on server`);
        }
      } catch (syncError) {
        console.warn(`Failed to sync update of workout with ID ${workoutEntry._id}:`, syncError);
        // This doesn't affect the local update, it just means we'll have inconsistency with the server
      }
    }
    
    return workoutEntry;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

