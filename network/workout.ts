import { Realm } from '@realm/react';
import Workout from "../types/Workout";
import WorkoutEntry from "../types/WorkoutEntry";

// Define the Realm schema for Workout
class WorkoutSchema extends Realm.Object<Workout> {
  name!: string;
  exercises!: string[];
  
  static schema = {
    name: 'Workout',
    embedded: true,
    properties: {
      name: 'string',
      exercises: 'string[]',
    },
  };
}

// Define the Realm schema for WorkoutEntry
class WorkoutEntrySchema extends Realm.Object<WorkoutEntry> {
  _id!: string;
  name!: string;
  exercises!: string[];
  date!: Date;

  static schema = {
    name: 'WorkoutEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      exercises: 'string[]',
      date: 'date',
    },
  };
}

// Initialize Realm
const realm = new Realm({
  schema: [WorkoutSchema, WorkoutEntrySchema],
  schemaVersion: 1,
});

export async function postWorkout(workout: Workout): Promise<WorkoutEntry> {
  try {
    let result: WorkoutEntry;
    realm.write(() => {
      const workoutEntry = {
        _id: new Realm.BSON.ObjectId().toString(),
        name: workout.name,
        exercises: workout.exercises,
        date: new Date(),
      };
      result = realm.create<WorkoutEntry>('WorkoutEntry', workoutEntry);
    });
    return result!;
  } catch (error) {
    console.error('Error creating workout:', error);
    throw error;
  }
}

export async function getWorkout(id: string): Promise<WorkoutEntry | null> {
  try {
    const workoutEntry = realm.objectForPrimaryKey<WorkoutEntry>('WorkoutEntry', id);
    if (!workoutEntry) return null;
    return {
      _id: workoutEntry._id,
      name: workoutEntry.name,
      exercises: [...workoutEntry.exercises],
      date: workoutEntry.date
    };
  } catch (error) {
    console.error('Error getting workout:', error);
    throw error;
  }
}

export async function getWorkouts(): Promise<WorkoutEntry[]> {
  try {
    const workouts = realm.objects<WorkoutEntry>('WorkoutEntry');
    return Array.from(workouts).map(workout => ({
      _id: workout._id,
      name: workout.name,
      exercises: [...workout.exercises],
      date: workout.date
    }));
  } catch (error) {
    console.error('Error getting workouts:', error);
    throw error;
  }
}

export async function deleteWorkout(id: string): Promise<void> {
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

export async function updateWorkout(workoutEntry: WorkoutEntry): Promise<WorkoutEntry> {
  try {
    realm.write(() => {
      realm.create<WorkoutEntry>(
        'WorkoutEntry',
        {
          _id: workoutEntry._id,
          name: workoutEntry.name,
          exercises: workoutEntry.exercises,
          date: workoutEntry.date
        },
        'modified'
      );
    });
    return workoutEntry;
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

// Clean up realm when app is closed
export function closeRealm() {
  if (!realm.isClosed) {
    realm.close();
  }
}