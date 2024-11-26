import { ScatterChart } from "@mui/x-charts";
import "./App.css";
import { useState } from "react";
import { formatTime, getCurrentDayUnixTime } from "./utils.ts";

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

  const handleEnterData = () => {
    if (currentExercise && weight && reps) {
      setData([...data, {
        x: getCurrentDayUnixTime(),
        y: weight / reps,
        id: data.length,
      }]);
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
              <option>Exercise 1</option>
              <option>Exercise 2</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

