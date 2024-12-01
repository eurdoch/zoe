import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import WorkoutEntry from './types/WorkoutEntry';
import { getWorkouts } from './network/workout';

const StartWorkoutScreen = () => {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  useEffect(() => {
    getWorkouts().then(ws => setWorkoutEntries(ws));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {workoutEntries.map(entry => <Text key={entry._id}>{entry.name}</Text>)}
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

export default StartWorkoutScreen;
