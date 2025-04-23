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
    // Instead of testing specific dates which are timezone-dependent,
    // we'll verify the formatting logic by checking patterns
    it('formats unix time to MM/DD format', () => {
      const timestamp = Math.floor(new Date(2023, 0, 15).getTime() / 1000); 
      const result = formatTime(timestamp);
      
      // Check that it follows MM/DD pattern
      expect(result).toMatch(/^\d{2}\/\d{2}$/);
      
      // Extract and validate month and day to verify without timezone issues
      const parts = result.split('/');
      // Convert to numbers to remove leading zeros
      const month = parseInt(parts[0], 10); 
      const day = parseInt(parts[1], 10);
      
      // Local date should give us month #1 (January)
      expect(month).toBe(1);
      expect(day).toBe(15);
    });

    it('pads single digit month and day with leading zeros', () => {
      const timestamp = Math.floor(new Date(2023, 2, 5).getTime() / 1000);
      const result = formatTime(timestamp);
      
      // Check for leading zeros
      expect(result).toMatch(/^0\d\/0\d$/);
      
      // Verify the actual month and day
      const parts = result.split('/');
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      
      expect(month).toBe(3); // March (0-indexed in JS Date)
      expect(day).toBe(5);
    });
  });

  describe('formatTimeWithYear', () => {
    it('formats unix time to MM/DD/YYYY format', () => {
      const timestamp = Math.floor(new Date(2023, 0, 15).getTime() / 1000);
      const result = formatTimeWithYear(timestamp);
      
      // Check that it follows MM/DD/YYYY pattern
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      
      // Extract and validate parts
      const parts = result.split('/');
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      expect(month).toBe(1);
      expect(day).toBe(15);
      expect(year).toBe(2023);
    });

    it('pads single digit month and day with leading zeros', () => {
      const timestamp = Math.floor(new Date(2023, 2, 5).getTime() / 1000);
      const result = formatTimeWithYear(timestamp);
      
      // Check for leading zeros in month and day
      expect(result).toMatch(/^0\d\/0\d\/\d{4}$/);
      
      // Verify the actual month, day, and year
      const parts = result.split('/');
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      expect(month).toBe(3);
      expect(day).toBe(5);
      expect(year).toBe(2023);
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