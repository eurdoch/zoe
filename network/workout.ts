import Workout from "../types/Workout";
import WorkoutEntry from "../types/Workout"

const VITALE_BOX_URL = "https://directto.link";

export async function postWorkout(workout: Workout): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/workout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workout),
  });
  return response.json();
}

export async function getWorkout(id: string): Promise<WorkoutEntry> {
  const response = await fetch(`${VITALE_BOX_URL}/workout/${id}`, {
    method: 'GET',
  });
  return response.json();
}

export async function getWorkouts(): Promise<WorkoutEntry[]> {
  const response = await fetch(`${VITALE_BOX_URL}/workout`, {
    method: 'GET',
  });
  return response.json();
}
