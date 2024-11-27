import { ScatterChart } from "@mui/x-charts";
import "./App.css";
import { useEffect, useState } from "react";
import { convertToDatabaseFormat, DataPoint, extractUnixTimeFromISOString, formatTime, getCurrentDayUnixTime, mapEntriesToDataPoint } from "./utils.ts";
import { getExerciseDataByName, getExerciseNames, postExercise } from "./exercises/network.ts";

function App() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentExercise, setCurrentExercise] = useState<string>("");
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [data, setData] = useState<DataPoint[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [newExercise, setNewExercise] = useState<string>("");
  const [debug, setDebug] = useState<string>("");

  // TODO load spinner during startup
  useEffect(() => {
    getExerciseNames().then(names => {
      setExercises(names);
    });
  });

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowModal(false);
  }

  const handleSelectExercise = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentExercise(e.target.value);
    const exerciseData = await getExerciseDataByName(e.target.value);
    const datapoints = exerciseData.map((entry, i) => {
      return {
        x: extractUnixTimeFromISOString(entry.createdAt),
        y: entry.weight / entry.reps,
        id: i,
      }
    });
    setData(datapoints);
    setShowModal(false);
  }

  const handleEnterData = async (_e: any) => {
    if (currentExercise && weight && reps) {
      setData([...data, {
        x: getCurrentDayUnixTime(),
        y: weight / reps,
        id: data.length,
      }]);
      const body = {
        name: convertToDatabaseFormat(currentExercise),
        weight: weight,
        reps: reps,
      };
      try {
        const insertedData = await postExercise(body);
        const updatedEntries = await getExerciseDataByName(insertedData.name);
        const datapoints = mapEntriesToDataPoint(updatedEntries);
        setData(datapoints);
      } catch (err: any) {
        // TODO figure out error logging in Tauri android!
      }
    }
  }

  const handleAddExercise = () => {
    if (newExercise.trim() !== "" && !exercises.includes(newExercise.trim())) {
      setExercises([...exercises, newExercise.trim()]);
      setNewExercise("");
      setShowModal(false);
      setData([]);
      setCurrentExercise(newExercise);
    }
  }

  return (
    <div className="flex flex-col gap-4 items-center p-4 w-screen h-screen">
      <div className="w-full h-1/3">
        <ScatterChart
          series={[
            {
              data: data,
            }
          ]}
          xAxis={[{ label: 'Date', valueFormatter: (v) => (formatTime(v)) }]}
          yAxis={[{ label: 'Reps / lb' }]}
        />
      </div>
      <div className="flex gap-2">
        <select 
          value={currentExercise}
          onChange={handleSelectExercise}
        >
          <option value="" disabled hidden>Select Exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise} value={exercise}>{exercise}</option>
          ))}
        </select>
        <button onClick={() => setShowModal(true)}>+</button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="weight">Weight:</label>
        <input
          id="weight"
          type="number"
          value={weight}
          onChange={(e) => setWeight(parseInt(e.target.value))}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="reps">Reps:</label>
        <input
          id="reps"
          type="number"
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value))}
        />
      </div>
      <button onClick={handleEnterData}>Enter Data</button>
      {showModal && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black bg-opacity-50" onClick={handleOverlayClick}>
          <div className="bg-white p-4 rounded-md" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              placeholder="Enter new exercise"
              className="border border-gray-300 p-2 rounded"
            />
            <button onClick={handleAddExercise} className="bg-blue-500 text-white p-2 rounded mt-2">Add Exercise</button>
          </div>
        </div>
      )}


      { debug && <div id="debug">{debug}</div> }
    </div>

  );
}

export default App;

