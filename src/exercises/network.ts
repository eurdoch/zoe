import { Exercise } from "./types";
import { fetch } from "@tauri-apps/plugin-http";

const VITALE_BOX_URL = "https://directto.link";

export async function postExercise(exercise: Exercise) {
  const response = await fetch(`${VITALE_BOX_URL}/exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exercise),
  });
  return response.json();
}

export async function getExerciseNames() {
  const response = await fetch(`${VITALE_BOX_URL}/exercise/names`, {
    method: 'GET',
  });
  return response.json();
}

