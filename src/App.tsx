import { ScatterChart } from "@mui/x-charts";
import "./App.css";
import { useEffect, useState } from "react";
import { convertToDatabaseFormat, formatTime, getCurrentDayUnixTime } from "./utils.ts";
import { getExerciseNames, postExercise } from "./exercises/network.ts";

interface DataPoint {
  x: number,
  y: number,
  id: number,
}

function App() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
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

  const handleLog = (e: any) => {
    e.preventDefault();
    setShowModal(true);
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowModal(false);
  }

  const handleSelectExercise = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentExercise(e.target.value);
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
      } catch (err: any) {
        // TODO figure out error logging in Tauri android!
      }
    }
  }

  const handleAddExercise = () => {
    if (newExercise.trim() !== "") {
      setExercises([...exercises, newExercise.trim()]);
      setNewExercise("");
    }
  }

  return (
    <div className="flex flex-col gap-2 items-center p-4 w-screen h-screen">
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
      <button onClick={handleLog}>{currentExercise ? currentExercise : "Choose Exercise" }</button>
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
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50" onClick={handleOverlayClick}>
          <div className="bg-white p-4 rounded-md" onClick={(e) => e.stopPropagation()}>
            <select onChange={handleSelectExercise}>
              {exercises.map((exercise) => (
                <option key={exercise} value={exercise}>{exercise}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                placeholder="Add new exercise"
              />
              <button onClick={handleAddExercise}>Add</button>
            </div>
          </div>
        </div>
      )}
      <div id="debug">{debug}</div>
    </div>
  );
}

export default App;

