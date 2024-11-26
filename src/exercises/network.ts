import { Exercise } from "./types";

export async function postExercise(exercise: Exercise) {
  const response = await fetch('/exercise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });
  return response.json();
}

