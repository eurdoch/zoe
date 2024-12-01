import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import WorkoutEntry from './types/WorkoutEntry';
import { getWorkout } from './network/workout';
import { convertFromDatabaseFormat } from './utils';

interface WorkoutScreenProps {
  navigation: any;
  route: any;
}

const WorkoutScreen = ({ navigation, route }: WorkoutScreenProps) => {
  const [workoutEntry, setWorkoutEntry] = useState<WorkoutEntry | null>(null);

  useEffect(() => {
    getWorkout(route.params.workout._id).then(w => setWorkoutEntry(w));
  })

  const handleLogExercise = (exerciseName: string) => {
    navigation.navigate('ExerciseLog', { name: exerciseName })
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {workoutEntry?.exercises.map((exerciseName, index) => (
        <TouchableOpacity onPress={() => handleLogExercise(exerciseName)} key={index} style={styles.entryContainer}>
          <Text style={styles.entryText}>{convertFromDatabaseFormat(exerciseName)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  entryContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  entryText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#008000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkoutScreen;
