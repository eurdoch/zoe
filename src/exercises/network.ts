import { Exercise } from "./types";

export async function postExercise(exercise: Exercise) {
  const response = await fetch('http://10.0.2.2/exercise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });
  return response.json();
}

