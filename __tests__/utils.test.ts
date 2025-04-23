import {
  formatTime,
  formatTimeWithYear,
  getCurrentDayUnixTime,
  convertFromDatabaseFormat,
  convertToDatabaseFormat,
  mapEntriesToDataPoint,
  mapWeightEntriesToDataPoint
} from '../utils';
import ExerciseEntry from '../types/ExerciseEntry';
import WeightEntry from '../types/WeightEntry';

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn()
}));

describe('Utils', () => {
  describe('formatTime', () => {
    it('formats unix time to MM/DD format', () => {
      // January 15, 2023 Unix timestamp
      const timestamp = 1673740800; // 2023-01-15 00:00:00 UTC
      expect(formatTime(timestamp)).toBe('01/15');
    });

    it('pads single digit month and day with leading zeros', () => {
      // March 5, 2023 Unix timestamp
      const timestamp = 1677974400; // 2023-03-05 00:00:00 UTC
      expect(formatTime(timestamp)).toBe('03/05');
    });
  });

  describe('formatTimeWithYear', () => {
    it('formats unix time to MM/DD/YYYY format', () => {
      // January 15, 2023 Unix timestamp
      const timestamp = 1673740800; // 2023-01-15 00:00:00 UTC
      expect(formatTimeWithYear(timestamp)).toBe('01/15/2023');
    });

    it('pads single digit month and day with leading zeros', () => {
      // March 5, 2023 Unix timestamp
      const timestamp = 1677974400; // 2023-03-05 00:00:00 UTC
      expect(formatTimeWithYear(timestamp)).toBe('03/05/2023');
    });
  });

  describe('getCurrentDayUnixTime', () => {
    it('returns the unix time at midnight of the current day', () => {
      // Use Jest's date mocking instead of manual mocking
      const mockDate = new Date(2023, 3, 15, 14, 30, 45); // April 15, 2023, 14:30:45
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      // Expected: April 15, 2023 00:00:00 in unix time (seconds)
      const expectedTimestamp = Math.floor(new Date(2023, 3, 15, 0, 0, 0).getTime() / 1000);
      
      expect(getCurrentDayUnixTime()).toBe(expectedTimestamp);
      
      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe('convertFromDatabaseFormat', () => {
    it('converts snake_case to Title Case', () => {
      expect(convertFromDatabaseFormat('bench_press')).toBe('Bench Press');
      expect(convertFromDatabaseFormat('shoulder_press')).toBe('Shoulder Press');
      expect(convertFromDatabaseFormat('single_word')).toBe('Single Word');
    });
  });

  describe('convertToDatabaseFormat', () => {
    it('converts normal text to snake_case', () => {
      expect(convertToDatabaseFormat('Bench Press')).toBe('bench_press');
      expect(convertToDatabaseFormat('Shoulder Press')).toBe('shoulder_press');
      expect(convertToDatabaseFormat('Single Word')).toBe('single_word');
    });
  });

  describe('mapEntriesToDataPoint', () => {
    it('correctly maps exercise entries to data points', () => {
      const entries: ExerciseEntry[] = [
        {
          _id: 'entry1',
          name: 'bench_press',
          weight: 100,
          reps: 10,
          createdAt: 1673740800,
          notes: 'Note 1'
        },
        {
          _id: 'entry2',
          name: 'squat',
          weight: 200,
          reps: 5,
          createdAt: 1677974400,
          notes: 'Note 2'
        }
      ];

      const dataPoints = mapEntriesToDataPoint(entries);
      
      expect(dataPoints).toEqual([
        {
          x: 1673740800,
          y: 10, // (100 * 10) / 100 = 10
          label: 'entry1'
        },
        {
          x: 1677974400,
          y: 10, // (200 * 5) / 100 = 10
          label: 'entry2'
        }
      ]);
    });
  });

  describe('mapWeightEntriesToDataPoint', () => {
    it('correctly maps weight entries to data points', () => {
      const entries: WeightEntry[] = [
        {
          _id: 'weight1',
          value: 70.5,
          createdAt: 1673740800
        },
        {
          _id: 'weight2',
          value: 69.8,
          createdAt: 1677974400
        }
      ];

      const dataPoints = mapWeightEntriesToDataPoint(entries);
      
      expect(dataPoints).toEqual([
        {
          x: 1673740800,
          y: 70.5,
          label: 'weight1'
        },
        {
          x: 1677974400,
          y: 69.8,
          label: 'weight2'
        }
      ]);
    });
  });
});