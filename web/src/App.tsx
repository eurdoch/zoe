import React, { useState, useEffect } from 'react';
import { 
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './App.css';

// API base URL - use proxy to avoid CORS issues
const API_BASE_URL = '/api';

// Define data types based on the mobile app's types
interface ExerciseEntry {
  _id: string;
  name: string;
  weight: number;
  reps: number;
  createdAt: number;
  notes: string;
}

interface WorkoutEntry {
  _id: string;
  name: string;
  exercises: string[];
  createdAt: number;
}

interface WeightEntry {
  _id: string;
  value: number;
  createdAt: number;
}

// Type for our chart data
interface ChartDataPoint {
  id: string;           // Unique identifier for each point
  date: string;         // Date string
  time?: string;        // Time string
  dateTime?: string;    // ISO date time
  timestamp: number;    // Unix timestamp
  dataType?: string;    // Type of data (weight, workout, exercise)
  exerciseName?: string; // Name of the exercise for exercise data
  workoutName?: string; // Name of the workout
  reps?: number;        // Reps for exercise data
  weight?: number;      // Weight (for both weight entries and exercise weight)
  workouts?: number;    // Workout count
  [key: string]: string | number | undefined; // For dynamic exercise names as keys
}

function App() {
  // State for storing data
  const [exerciseData, setExerciseData] = useState<ExerciseEntry[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutEntry[]>([]);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  // State for tracking loading and errors
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for checkboxes to filter data series
  const [dataOptions, setDataOptions] = useState({
    weight: false,
    workouts: false,
    exercises: {}
  });

  // Fetch data from the server
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching data from server:', API_BASE_URL);
        
        // We'll use Promise.allSettled for weight and workout data
        const [weightResponse, workoutResponse, exerciseNamesResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/weight`),
          fetch(`${API_BASE_URL}/workout`),
          fetch(`${API_BASE_URL}/exercise/names`)
        ]);
        
        // Process weight data if successful
        if (weightResponse.status === 'fulfilled' && weightResponse.value.ok) {
          const jsonData = await weightResponse.value.json();
          console.log('Successfully received weight data');
          if (Array.isArray(jsonData)) {
            setWeightData(jsonData);
          }
        } else {
          console.warn('Failed to fetch weight data');
        }
        
        // Process workout data if successful
        if (workoutResponse.status === 'fulfilled' && workoutResponse.value.ok) {
          const jsonData = await workoutResponse.value.json();
          console.log('Successfully received workout data');
          if (Array.isArray(jsonData)) {
            setWorkoutData(jsonData);
          }
        } else {
          console.warn('Failed to fetch workout data');
        }
        
        // Get exercise names, then fetch data for each exercise
        if (exerciseNamesResponse.status === 'fulfilled' && exerciseNamesResponse.value.ok) {
          const exerciseNames = await exerciseNamesResponse.value.json();
          console.log('Successfully received exercise names:', exerciseNames);
          
          if (Array.isArray(exerciseNames)) {
            // Fetch data for each exercise name
            const exerciseDataPromises = exerciseNames.map(name => 
              fetch(`${API_BASE_URL}/exercise/${name}`)
                .then(response => {
                  if (!response.ok) {
                    throw new Error(`Failed to fetch data for ${name}`);
                  }
                  return response.json();
                })
                .then(data => {
                  console.log(`Received data for ${name}:`, data);
                  return data;
                })
                .catch(error => {
                  console.warn(`Error fetching data for ${name}:`, error);
                  return [];
                })
            );
            
            // Wait for all exercise data to be fetched
            const exerciseDataResults = await Promise.all(exerciseDataPromises);
            
            // Combine all exercise data into a single array
            const allExerciseData = exerciseDataResults.flat();
            console.log('Combined exercise data:', allExerciseData);
            setExerciseData(allExerciseData);
          }
        } else {
          console.warn('Failed to fetch exercise names');
        }
        
        // Check if any main requests failed
        const anyFailed = [weightResponse, workoutResponse, exerciseNamesResponse].some(
          response => response.status === 'rejected' || 
            (response.status === 'fulfilled' && !response.value.ok)
        );
        
        if (anyFailed) {
          setError('Could not fetch all data from server. Some data may be missing.');
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data from server.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Process data for chart whenever source data or options change
  useEffect(() => {
    const prepareChartData = () => {
      console.log('Preparing chart data with:', { 
        weightDataCount: weightData.length, 
        workoutDataCount: workoutData.length, 
        exerciseDataCount: exerciseData.length,
        dataOptions
      });
      
      // Completely redesigned approach to show individual points
      const individualDataPoints: ChartDataPoint[] = [];
      let pointId = 0;
      
      // Add weight data if enabled
      if (dataOptions.weight) {
        weightData.forEach(entry => {
          const date = new Date(entry.createdAt * 1000);
          const dateStr = date.toLocaleDateString();
          const timeStr = date.toLocaleTimeString();
          
          individualDataPoints.push({
            id: `w_${pointId++}`,
            date: dateStr,
            time: timeStr,
            dateTime: date.toISOString(),
            timestamp: entry.createdAt,
            weight: entry.value,
            dataType: 'weight'
          });
        });
      }
      
      // Add workout data if enabled
      if (dataOptions.workouts) {
        workoutData.forEach(entry => {
          const date = new Date(entry.createdAt * 1000);
          const dateStr = date.toLocaleDateString();
          const timeStr = date.toLocaleTimeString();
          
          individualDataPoints.push({
            id: `wo_${pointId++}`,
            date: dateStr,
            time: timeStr,
            dateTime: date.toISOString(),
            timestamp: entry.createdAt,
            workouts: 1, // Each workout is a single point
            workoutName: entry.name,
            dataType: 'workout'
          });
        });
      }
      
      // Add exercise data - each exercise entry is its own point
      exerciseData.forEach(entry => {
        // Skip if the specific exercise type is disabled
        const exerciseKey = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!dataOptions.exercises[exerciseKey as keyof typeof dataOptions.exercises]) {
          return;
        }
        
        // Make sure we're parsing createdAt correctly (it's in seconds since epoch)
        const date = new Date(entry.createdAt * 1000); 
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();
        
        // Calculate the value using the formula (reps * weight) / 100
        const value = (entry.reps * entry.weight) / 100;
        
        // Create a data point for this specific exercise entry
        const dataPoint: ChartDataPoint = {
          id: `ex_${pointId++}`,
          date: dateStr,
          time: timeStr,
          dateTime: date.toISOString(),
          timestamp: entry.createdAt,
          dataType: 'exercise',
          exerciseName: entry.name,
          reps: entry.reps,
          weight: entry.weight
        };
        
        // Add the value under the exercise name as the key
        dataPoint[entry.name] = value;
        
        // Add this individual point to our array
        individualDataPoints.push(dataPoint);
      });
      
      // Sort all points by timestamp
      const chartData = individualDataPoints.sort((a, b) => a.timestamp - b.timestamp);
      
      console.log('Final chart data (individual points):', chartData);
      setChartData(chartData);
    };
    
    prepareChartData();
  }, [exerciseData, weightData, workoutData, dataOptions]);

  // Handle checkbox changes
  const handleOptionChange = (optionPath: string, value: boolean) => {
    const paths = optionPath.split('.');
    
    setDataOptions(prevOptions => {
      // Deep clone the options object
      const newOptions = JSON.parse(JSON.stringify(prevOptions));
      
      // Update the specific path
      let current = newOptions;
      for (let i = 0; i < paths.length - 1; i++) {
        current = current[paths[i]];
      }
      current[paths[paths.length - 1]] = value;
      
      return newOptions;
    });
  };

  // Get list of unique exercise names from data
  const getUniqueExerciseNames = (): string[] => {
    const names = new Set<string>();
    exerciseData.forEach(entry => names.add(entry.name));
    return Array.from(names);
  };

  // Format exercise name for display (wide_grip_pulldown => Wide Grip Pulldown)
  const formatExerciseName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Make sure the dataOptions.exercises has all the exercise names
  useEffect(() => {
    const exerciseNames = getUniqueExerciseNames();
    const updatedExercises = { ...dataOptions.exercises };
    let hasChanges = false;
    
    exerciseNames.forEach(name => {
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (updatedExercises[key as keyof typeof updatedExercises] === undefined) {
        // Initialize all exercise options to false for initial load
        updatedExercises[key as keyof typeof updatedExercises] = false;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setDataOptions(prev => ({
        ...prev,
        exercises: updatedExercises
      }));
    }
  }, [exerciseData]);

  // No mock data generators - using only real server data

  return (
    <div className="app">
      <main className="app-content">
        {loading ? (
          <div className="loading">Loading data...</div>
        ) : error ? (
          <div className="error">
            <p>Error: {error}</p>
            <p>Using mock data for demonstration</p>
          </div>
        ) : null}
        
        <div className="chart-container">
          
          <div className="chart">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    scale="time" 
                    domain={['auto', 'auto']}
                    type="number"
                    tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleDateString()}
                    name="Date"
                    padding={{ left: 30, right: 30 }}
                    ticks={(() => {
                      // Show only 5 ticks total regardless of actual data points
                      if (chartData.length === 0) return [];
                      const timestamps = chartData.map(d => d.timestamp);
                      const minTime = Math.min(...timestamps);
                      const maxTime = Math.max(...timestamps);
                      const range = maxTime - minTime;
                      
                      // Generate exactly 5 evenly spaced ticks
                      return [0, 1, 2, 3, 4].map(i => 
                        Math.round(minTime + (range * i / 4))
                      );
                    })()}
                  />
                  <YAxis 
                    name="Value"
                    label={{ value: 'Score / Weight / Count', angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']}
                    allowDataOverflow={false}
                    tickCount={6}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload;
                        const date = new Date(data.timestamp * 1000);
                        
                        return (
                          <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
                            <p>{date.toLocaleDateString()}</p>
                            {data.exerciseName ? (
                              <>
                                <p>{formatExerciseName(data.exerciseName)}</p>
                                <p>{`${data.reps} reps × ${data.weight} kg`}</p>
                              </>
                            ) : data.dataType === 'weight' ? (
                              <p>{`Weight: ${data.weight} kg`}</p>
                            ) : (
                              <p>Workout: {data.workoutName || "Workout"}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  
                  {dataOptions.weight && (
                    <Scatter 
                      name="Weight (kg)" 
                      dataKey="weight" 
                      fill="#8884d8" 
                      shape="circle"
                      legendType="circle"
                    />
                  )}
                  
                  {dataOptions.workouts && (
                    <Scatter 
                      name="Workouts" 
                      dataKey="workouts" 
                      fill="#82ca9d" 
                      shape="circle"
                      legendType="circle"
                    />
                  )}
                  
                  {/* Display available exercise data */}
                  {getUniqueExerciseNames().map((name, index) => {
                    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (dataOptions.exercises[key as keyof typeof dataOptions.exercises]) {
                      const color = `#${Math.floor(Math.random()*16777215).toString(16)}`;
                      return (
                        <Scatter 
                          key={name}
                          name={`${formatExerciseName(name)} (score)`} 
                          dataKey={name} 
                          fill={color}
                          shape="circle"
                          legendType="circle"
                        />
                      );
                    }
                    return null;
                  })}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <p>No data available from server.</p>
                <p>Please ensure your fitness data has been logged in the mobile app.</p>
              </div>
            )}
          </div>
          
          <div className="data-options-container">
            <div className="data-options">
              <div className="option-group">
                <h3>Data Series</h3>
                <label>
                  <input 
                    type="checkbox" 
                    checked={dataOptions.weight} 
                    onChange={(e) => handleOptionChange('weight', e.target.checked)} 
                  />
                  Weight
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={dataOptions.workouts} 
                    onChange={(e) => handleOptionChange('workouts', e.target.checked)} 
                  />
                  Workouts
                </label>
              </div>
              
              <div className="option-group">
                <h3>Exercises</h3>
                <label>
                  <input 
                    type="checkbox" 
                    checked={getUniqueExerciseNames().every(name => {
                      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      return dataOptions.exercises[key as keyof typeof dataOptions.exercises] ?? false;
                    })} 
                    onChange={(e) => {
                      // Apply the same checked state to all exercise options
                      const exerciseNames = getUniqueExerciseNames();
                      exerciseNames.forEach(name => {
                        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        handleOptionChange(`exercises.${key}`, e.target.checked);
                      });
                    }} 
                  />
                  <strong>Select/Deselect All</strong>
                </label>
                <div className="exercise-checkbox-grid">
                  {getUniqueExerciseNames().map(name => {
                    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (
                      <label key={key}>
                        <input 
                          type="checkbox" 
                          checked={dataOptions.exercises[key as keyof typeof dataOptions.exercises] ?? false} 
                          onChange={(e) => handleOptionChange(`exercises.${key}`, e.target.checked)} 
                        />
                        {formatExerciseName(name)}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
