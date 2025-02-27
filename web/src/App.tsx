import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
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
  date: string;
  [key: string]: string | number | undefined;
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
    weight: true,
    workouts: true,
    exercises: {
      squats: true,
      benchPress: true,
      deadlift: true,
    }
  });

  // Fetch data from the server
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching data from server:', API_BASE_URL);
        
        // We'll use Promise.allSettled to try all requests even if some fail
        const [weightResponse, workoutResponse, exerciseResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/weight`),
          fetch(`${API_BASE_URL}/workout`),
          fetch(`${API_BASE_URL}/exercise`)
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
        
        // Process exercise data if successful
        if (exerciseResponse.status === 'fulfilled' && exerciseResponse.value.ok) {
          const jsonData = await exerciseResponse.value.json();
          console.log('Successfully received exercise data');
          if (Array.isArray(jsonData)) {
            setExerciseData(jsonData);
          }
        } else {
          console.warn('Failed to fetch exercise data');
        }
        
        // Check if any requests failed
        const anyFailed = [weightResponse, workoutResponse, exerciseResponse].some(
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
      
      const dataPoints = new Map<string, ChartDataPoint>();
      
      // Add weight data if enabled
      if (dataOptions.weight) {
        weightData.forEach(entry => {
          const dateStr = new Date(entry.createdAt).toLocaleDateString();
          if (!dataPoints.has(dateStr)) {
            dataPoints.set(dateStr, { date: dateStr });
          }
          
          const point = dataPoints.get(dateStr)!;
          point.weight = entry.value;
        });
      }
      
      // Add workout count data if enabled
      if (dataOptions.workouts) {
        const workoutCounts = new Map<string, number>();
        
        workoutData.forEach(entry => {
          const dateStr = new Date(entry.createdAt).toLocaleDateString();
          const count = workoutCounts.get(dateStr) || 0;
          workoutCounts.set(dateStr, count + 1);
        });
        
        workoutCounts.forEach((count, dateStr) => {
          if (!dataPoints.has(dateStr)) {
            dataPoints.set(dateStr, { date: dateStr });
          }
          
          const point = dataPoints.get(dateStr)!;
          point.workouts = count;
        });
      }
      
      // Add exercise data if enabled
      exerciseData.forEach(entry => {
        // Skip if the specific exercise type is disabled
        const exerciseKey = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!dataOptions.exercises[exerciseKey as keyof typeof dataOptions.exercises]) {
          return;
        }
        
        const dateStr = new Date(entry.createdAt).toLocaleDateString();
        if (!dataPoints.has(dateStr)) {
          dataPoints.set(dateStr, { date: dateStr });
        }
        
        const point = dataPoints.get(dateStr)!;
        // Use exercise name as the key and weight as the value
        point[entry.name] = entry.weight;
      });
      
      // Convert map to array and sort by date
      const chartData = Array.from(dataPoints.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log('Final chart data:', chartData);
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
  
  // Make sure the dataOptions.exercises has all the exercise names
  useEffect(() => {
    const exerciseNames = getUniqueExerciseNames();
    const updatedExercises = { ...dataOptions.exercises };
    let hasChanges = false;
    
    exerciseNames.forEach(name => {
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (updatedExercises[key as keyof typeof updatedExercises] === undefined) {
        updatedExercises[key as keyof typeof updatedExercises] = true;
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
      <header className="app-header">
        <h1>zoe fitness dashboard</h1>
      </header>
      
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
          <h2>Fitness Progress</h2>
          
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
              {getUniqueExerciseNames().map(name => {
                const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                return (
                  <label key={key}>
                    <input 
                      type="checkbox" 
                      checked={dataOptions.exercises[key as keyof typeof dataOptions.exercises] ?? false} 
                      onChange={(e) => handleOptionChange(`exercises.${key}`, e.target.checked)} 
                    />
                    {name}
                  </label>
                );
              })}
            </div>
          </div>
          
          <div className="chart">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  
                  {dataOptions.weight && (
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#8884d8" 
                      name="Weight (kg)" 
                      dot={{ strokeWidth: 2 }} 
                    />
                  )}
                  
                  {dataOptions.workouts && (
                    <Line 
                      type="monotone" 
                      dataKey="workouts" 
                      stroke="#82ca9d" 
                      name="Workouts" 
                      dot={{ strokeWidth: 2 }} 
                    />
                  )}
                  
                  {/* Display available exercise data */}
                  {getUniqueExerciseNames().map((name, index) => {
                    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (dataOptions.exercises[key as keyof typeof dataOptions.exercises]) {
                      return (
                        <Line 
                          key={name}
                          type="monotone" 
                          dataKey={name} 
                          stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} 
                          name={`${name} (kg)`} 
                          dot={{ strokeWidth: 2 }} 
                        />
                      );
                    }
                    return null;
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <p>No data available from server.</p>
                <p>Please ensure your fitness data has been logged in the mobile app.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
