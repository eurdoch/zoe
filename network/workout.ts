import { Realm } from '@realm/react';
import Workout from "../types/Workout";
import WorkoutEntry from "../types/WorkoutEntry";
import { API_BASE_URL, SYNC_ENABLED } from '../config';
import { syncService } from '../services/SyncService';

export async function postWorkout(workout: Workout, realm: Realm): Promise<WorkoutEntry> {
  try {
    let result: WorkoutEntry;
    
    // Create in local Realm database
    realm.write(() => {
      const workoutEntry = {
        _id: new Realm.BSON.ObjectId().toString(),
        name: workout.name,
        exercises: workout.exercises,
        date: new Date(),
      };
      result = realm.create<WorkoutEntry>('WorkoutEntry', workoutEntry);
    });
    
    // If sync is enabled, try to sync immediately with the server
    if (SYNC_ENABLED) {
      try {
        // Push the new workout to the server
        await fetch(`${API_BASE_URL}/workouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(result),
        });
      } catch (syncError) {
        console.warn('Failed to immediately sync new workout, will sync later:', syncError);
        // This doesn't affect the local save, it just means we'll sync later
      }
    }
    
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
    realm.write(() => {
      const workoutEntry = realm.objectForPrimaryKey<WorkoutEntry>('WorkoutEntry', id);
      if (workoutEntry) {
        realm.delete(workoutEntry);
      }
    });
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

export async function updateWorkout(workoutEntry: WorkoutEntry, realm: Realm): Promise<WorkoutEntry> {
  try {
    realm.write(() => {
      realm.create<WorkoutEntry>(
        'WorkoutEntry',
        {
          _id: workoutEntry._id,
          name: workoutEntry.name,
          exercises: workoutEntry.exercises,
          createdAt: workoutEntry.createdAt,
        },
        Realm.UpdateMode.Modified,
      );
    });
    return workoutEntry;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

