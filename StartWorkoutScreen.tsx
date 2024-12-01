import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import WorkoutEntry from './types/WorkoutEntry';
import { deleteWorkout, getWorkouts } from './network/workout';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToastError, showToastInfo } from './utils';

interface StartWorkoutScreenProps {
  navigation: any;
}

const StartWorkoutScreen = ({ navigation }: StartWorkoutScreenProps) => {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  useEffect(() => {
    getWorkouts().then(ws => setWorkoutEntries(ws));
  }, []);

  const handleStartWorkout = (entry: WorkoutEntry) => {
    navigation.navigate('Workout', { workout: entry })
  }

  const handleDeleteWorkout = async (entry: WorkoutEntry) => {
    const result = await deleteWorkout(entry._id);
    if (result.acknowledged) {
      const updatedWorkouts = await getWorkouts();
      setWorkoutEntries(updatedWorkouts);
      showToastInfo("Workout deleted.");
    } else {
      showToastError("Workout could not be deleted. Try again.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {workoutEntries.map(entry => (
        <View style={styles.row} key={entry._id}>
          <TouchableOpacity onPress={() => handleStartWorkout(entry)} style={styles.entryContainer}> 
            <Text style={styles.entryText}>{entry.name}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteWorkout(entry)}> 
            <MaterialCommunityIcons name="delete" size={20}/>
          </TouchableOpacity>
        </View>
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
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
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

export default StartWorkoutScreen;
