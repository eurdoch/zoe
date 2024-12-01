export default interface ExerciseEntry {
  _id: string,
  name: string,
  weight: number,
  reps: number,
  createdAt: number, // unix time in seconds
}

