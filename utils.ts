import { getExerciseDataByName } from "./network/exercise";
import ExerciseEntry from "./types/ExerciseEntry";
import DataPoint from "./types/DataPoint";
import Toast from "react-native-toast-message";

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

export const getExercisesByNameAndConvertToDataPoint = async (name: string): Promise<DataPoint[]> => {
  const exerciseData = await getExerciseDataByName(name);
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

interface FoodNutrition {
  food_name: string;
  serving_qty: number;
  nf_calories: number;
  nf_total_fat: number;
  nf_total_carbohydrate: number;
  nf_protein: number;
}

interface NutritionTotals {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

export function calculateNutrition(food: FoodNutrition, servingAmount: number): NutritionTotals {
  const multiplier = servingAmount / food.serving_qty;
  
  return {
    calories: Math.round(food.nf_calories * multiplier),
    fat: Math.round(food.nf_total_fat * multiplier * 10) / 10,
    carbs: Math.round(food.nf_total_carbohydrate * multiplier * 10) / 10,
    protein: Math.round(food.nf_protein * multiplier * 10) / 10
  };
}

