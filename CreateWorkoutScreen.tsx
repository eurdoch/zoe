import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getExerciseNames } from './network/exercise';
import { convertFromDatabaseFormat } from './utils';

interface CreateWorkoutScreenProps {
  workoutList: string[];
}

const CreateWorkoutScreen = ({ workoutList }: CreateWorkoutScreenProps) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);

  useEffect(() => {
    getExerciseNames().then((names: string[]) => {
      setAvailableExercises(names);
    });
  });

  const handleWorkoutPress = (workout: string) => {
    if (selectedExercises.includes(workout)) {
      setSelectedExercises(selectedExercises.filter((item) => item !== workout));
    } else {
      setSelectedExercises([...selectedExercises, workout]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        { availableExercises.map((exercise: string, index: number) => <TouchableOpacity style={[styles.listItem, selectedExercises.includes(exercise) && styles.selectedItem]} onPress={() => handleWorkoutPress(exercise)} key={index}>
          <Text style={styles.exerciseText}>{convertFromDatabaseFormat(exercise)}</Text>
        </TouchableOpacity>)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  workoutItem: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    borderRadius: 8,
  },
  selectedWorkoutItem: {
    backgroundColor: '#00ff00',
  },
  selectedWorkoutsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  exerciseText: {
    fontSize: 30,
  },
  listItem: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: '#00ff00',
  },
});

export default CreateWorkoutScreen;
