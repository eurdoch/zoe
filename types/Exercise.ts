export default interface Exercise {
  name: string,
  weight: number,
  reps: number,
  createdAt: number, // unix time in seconds
  notes?: string,
}
