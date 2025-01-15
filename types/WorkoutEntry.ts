import Workout from "./Workout";

export default interface WorkoutEntry extends Workout {
  _id: string;
  name: string;
  exercises: string[];
}
