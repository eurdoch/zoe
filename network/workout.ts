import { Realm } from '@realm/react';
import Workout from "../types/Workout";
import WorkoutEntry from "../types/WorkoutEntry";

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
          createdAt: Math.floor(Date.now() / 1000)
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

