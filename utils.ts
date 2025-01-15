import { getExerciseDataByName } from "./network/exercise";
import ExerciseEntry from "./types/ExerciseEntry";
import DataPoint from "./types/DataPoint";
import Toast from "react-native-toast-message";
import WeightEntry from "./types/WeightEntry";
import { Realm } from '@realm/react';

export const formatTime = (unixTime: number): string => {
    const date = new Date(unixTime * 1000);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
};

/** 
 * Returns the Unix time at midnight (00:00:00) of the current day.
 * @returns The Unix time in milliseconds for the start of the current day.
 */
export const getCurrentDayUnixTime = (): number => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(midnight.getTime() / 1000);
}

export const convertFromDatabaseFormat = (str: string): string => {
  return str.replace(/_/g, ' ').replace(
    /\b\w/g,
    (match) => match.toUpperCase()
  );
};

export const convertToDatabaseFormat = (str: string): string => {
  return str.replace(/ /g, '_').toLowerCase();
};

export const mapEntriesToDataPoint = (entries: ExerciseEntry[]): DataPoint[] => {
  return entries.map((entry, _i) => {
    return {
      x: entry.createdAt,
      y: Number(((entry.weight * entry.reps) / 100).toFixed(1)),
      label: entry._id,
    }
  });
}

export const mapWeightEntriesToDataPoint = (entries: WeightEntry[]): DataPoint[] => {
  return entries.map(entry => ({
    x: entry.createdAt,
    y: entry.value,
  }));
}

export const getExercisesByNameAndConvertToDataPoint = async (name: string, realm: Realm): Promise<DataPoint[]> => {
  const exerciseData = await getExerciseDataByName(name, realm);
  return mapEntriesToDataPoint(exerciseData);
}

export const showToastInfo = (message: string) => {
  Toast.show({
    type: 'info',
    text1: 'Hooray!',
    text2: message,
  })
}

export const showToastError = (message: string) => {
  Toast.show({
    type: 'error',
    text1: 'Whoops!',
    text2: message,
  })
}

