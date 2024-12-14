import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkouts } from '../network/workout';
import FloatingActionButton from '../components/FloatingActionButton';
import {useFocusEffect} from '@react-navigation/native';

interface WorkoutsScreenProps {
  navigation: any;
}

const WorkoutsScreen = ({ navigation }: WorkoutsScreenProps) => {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  // For navigation to and back to
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = getWorkouts().then(ws => setWorkoutEntries(ws));
      return () => unsubscribe;
    }, [])
  );

  const handleStartWorkout = (entry: WorkoutEntry) => {
    navigation.navigate('Workout', { workout: entry })
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {workoutEntries.map(entry => (
          <View style={styles.row} key={entry._id}>
            <TouchableOpacity onPress={() => handleStartWorkout(entry)} style={styles.entryContainer}> 
              <Text style={styles.entryText}>{entry.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <FloatingActionButton onPress={() => navigation.navigate('CreateWorkout')} />

    </>
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

export default WorkoutsScreen;
