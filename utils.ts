import { ExerciseEntry } from "./exercises/types";

export interface DataPoint {
  x: number,
  y: number,
  id: number,
}

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

export const extractUnixTimeFromISOString = (isoString: string): number => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const midnight = new Date(year, month, day);
  return Math.floor(midnight.getTime() / 1000);
};

export const mapEntriesToDataPoint = (entries: ExerciseEntry[]): DataPoint[] => {
  return entries.map((entry, i) => {
    return {
      x: extractUnixTimeFromISOString(entry.createdAt),
      y: entry.weight / entry.reps,
      id: i,
    }
  });
}

