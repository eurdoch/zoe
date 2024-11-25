import { ScatterChart } from "@mui/x-charts";
import "./App.css";
import { useState } from "react";

const data = [
  { x: 100, y: 200, id: 1 },
  { x: 120, y: 100, id: 2 },
  { x: 170, y: 300, id: 3 },
  { x: 140, y: 250, id: 4 },
  { x: 150, y: 400, id: 5 },
  { x: 110, y: 280, id: 6 },
];

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
          series={[{ data }]}
          xAxis={[{ min: 0, label: 'Date' }]}
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

