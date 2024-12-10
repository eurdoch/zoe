import Workout from "../types/Workout";
import WorkoutEntry from "../types/WorkoutEntry";
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
export async function deleteWorkout(id: string): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/workout/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}
export async function updateWorkout(workoutEntry: WorkoutEntry): Promise<any> {
  const response = await fetch(`${VITALE_BOX_URL}/workout/${workoutEntry._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workoutEntry),
  });
  return response.json();
}
