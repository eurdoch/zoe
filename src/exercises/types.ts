export interface Exercise {
  name: string,
  weight: number,
  reps: number,
}

export interface ExerciseEntry {
  _id: string,
  name: string,
  weight: number,
  reps: number,
  createdAt: string,
}
