import { ScatterChart } from "@mui/x-charts";
import "./App.css";
import { useState } from "react";

interface DataPoint {
  x: Date,
  y: number,
  id: number,
}

let data: DataPoint[] = [];

function App() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);

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

  return (
    <div className="flex flex-col gap-2 items-center p-4 w-screen h-screen">
      <div className="w-full h-1/3">
        <ScatterChart
          series={ data.map((dataPoint) => ({
            x: dataPoint.x.toString(),
            y: dataPoint.y,
            id: dataPoint.id,
          }))}
          xAxis={[{ label: 'Date' }]}
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

