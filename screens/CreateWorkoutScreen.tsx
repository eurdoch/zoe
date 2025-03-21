import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Button } from 'react-native';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat } from '../utils';
import { postWorkout } from '../network/workout';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useRealm } from '@realm/react';

interface CreateWorkoutScreenProps {
  navigation: any;
}

const CreateWorkoutScreen = ({ navigation }: CreateWorkoutScreenProps) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [workoutName, setWorkoutName] = useState<string>('');
  const realm = useRealm();

  useEffect(() => {
    getExerciseNames(realm).then((names: string[]) => {
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

  const handleAddWorkout = async () => {
    if (!workoutName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Whoops!',
        text2: 'Must give workout name.'
      })
      return;
    }

    const result = await postWorkout({
      name: workoutName,
      exercises: selectedExercises,
      createdAt: Date.now(),
    }, realm);
    if (result.name === workoutName && 
        JSON.stringify(result.exercises) === JSON.stringify(selectedExercises)) {
      navigation.pop(1);
      navigation.navigate('Workout', { workout: result })
    } else {
      Toast.show({
        type: 'error',
        text1: 'Whoops!',
        text2: 'Workout could not be saved, please try again.'
      })
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter workout name"
        value={workoutName}
        onChangeText={setWorkoutName}
      />
      <Button title="Add Workout" onPress={handleAddWorkout} />
      <ScrollView>
        { availableExercises.map((exercise: string, index: number) => 
          <TouchableOpacity 
            style={[
              styles.listItem, 
              selectedExercises.includes(exercise) && styles.selectedItem
            ]} 
            onPress={() => handleWorkoutPress(exercise)} 
            key={index}
          >
            <Text style={styles.exerciseText}>
              {convertFromDatabaseFormat(exercise)}
            </Text>
          </TouchableOpacity>
        )}
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
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});

export default CreateWorkoutScreen;
