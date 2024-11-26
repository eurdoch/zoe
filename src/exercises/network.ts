import { Exercise } from "./types";

const VITALE_BOX_URL = "18.237.137.224"

export async function postExercise(exercise: Exercise) {
  const response = await fetch(`http://${VITALE_BOX_URL}/exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });
  return response.json();
}

