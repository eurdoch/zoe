import Exercise from "../types/Exercise";
import ExerciseEntry from "../types/ExerciseEntry";

const VITALE_BOX_URL = "https://directto.link";

// TODO switch network and exercises in file tree
export async function postExercise(exercise: Exercise): Promise<ExerciseEntry> {
  const response = await fetch(`${VITALE_BOX_URL}/exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });
  return response.json();
}

export async function getExerciseNames(): Promise<string[]> {
  const response = await fetch(`${VITALE_BOX_URL}/exercise/names`, {
    method: 'GET',
  });
  return response.json();
}

export async function getExerciseDataByName(name: string): Promise<ExerciseEntry[]> {
  const response = await fetch(`${VITALE_BOX_URL}/exercise/${name}`, {
    method: 'GET',
  });
  return response.json();
}

export async function getExerciseById(id: string): Promise<ExerciseEntry> {
  const response = await fetch(`${VITALE_BOX_URL}/exercise?id=${id}`, {
    method: 'GET',
  });
  return response.json();
}
