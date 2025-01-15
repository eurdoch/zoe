import { Realm } from '@realm/react';
import Exercise from "../types/Exercise";
import ExerciseEntry from "../types/ExerciseEntry";

// Define the Realm schema for Exercise
class ExerciseSchema extends Realm.Object<Exercise> {
  name!: string;
  weight!: number;
  reps!: number;
  createdAt!: number;
  notes!: string;

  static schema = {
    name: 'Exercise',
    properties: {
      name: 'string',
      weight: 'double',
      reps: 'int',
      createdAt: 'int',
      notes: 'string',
    },
  };
}

// Define the Realm schema for ExerciseEntry
class ExerciseEntrySchema extends Realm.Object<ExerciseEntry> {
  _id!: string;
  name!: string;
  weight!: number;
  reps!: number;
  createdAt!: number;
  notes!: string;

  static schema = {
    name: 'ExerciseEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      weight: 'double',
      reps: 'int',
      createdAt: 'int',
      notes: 'string',
    },
  };
}

// Initialize Realm
const realm = new Realm({
  schema: [ExerciseSchema, ExerciseEntrySchema],
  schemaVersion: 1,
});

export async function postExercise(exercise: Exercise): Promise<ExerciseEntry> {
  try {
    let result: ExerciseEntry;
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

export async function getExerciseNames(): Promise<string[]> {
  try {
    const exercises = realm.objects<ExerciseEntry>('ExerciseEntry');
    const uniqueNames = new Set(exercises.map(exercise => exercise.name));
    return Array.from(uniqueNames);
  } catch (error) {
    console.error('Error getting exercise names:', error);
    throw error;
  }
}

export async function getExerciseDataByName(name: string): Promise<ExerciseEntry[]> {
  try {
    const exercises = realm.objects<ExerciseEntry>('ExerciseEntry')
      .filtered('name == $0', name);
    return Array.from(exercises).map(exercise => ({ ...exercise }));
  } catch (error) {
    console.error('Error getting exercise data by name:', error);
    throw error;
  }
}

export async function getExerciseById(id: string): Promise<ExerciseEntry> {
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

export async function deleteExerciseById(id: string): Promise<void> {
  try {
    realm.write(() => {
      const exercise = realm.objectForPrimaryKey<ExerciseEntry>('ExerciseEntry', id);
      if (exercise) {
        realm.delete(exercise);
      }
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
}

// Clean up realm when app is closed
export function closeRealm() {
  if (!realm.isClosed) {
    realm.close();
  }
}
