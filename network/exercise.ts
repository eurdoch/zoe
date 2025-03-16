import { Realm } from '@realm/react';
import Exercise from "../types/Exercise";
import ExerciseEntry from "../types/ExerciseEntry";

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

