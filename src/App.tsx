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
  const [showModal, setShowModal] = useState(false);

  const handleLog = (e: any) => {
    e.preventDefault();
    setShowModal(true);
  }

  const handleOverlayClick = () => {
    setShowModal(false);
  }

  return (
    <div className="flex flex-col items-center p-4 w-screen h-screen">
      <div className="w-full h-1/3">
        <ScatterChart
          series={[{ data }]}
          xAxis={[{ min: 0, label: 'Date' }]}
          yAxis={[{ label: 'Reps / lb' }]}
        />
      </div>
      <button onClick={handleLog}>Choose Exercise</button>
      {showModal && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50" onClick={handleOverlayClick}>
          <div className="bg-white p-4 rounded-md">
            <select>
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

