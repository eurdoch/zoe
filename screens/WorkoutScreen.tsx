
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkout, updateWorkout } from '../network/workout';
import { convertFromDatabaseFormat, showToastInfo } from '../utils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FloatingActionButton from '../components/FloatingActionButton';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import CustomModal from '../CustomModal';
import { Dropdown } from 'react-native-element-dropdown';
interface WorkoutScreenProps {
  navigation: any;
  route: any;
}
const WorkoutScreen = ({ navigation, route }: WorkoutScreenProps) => {
  const [workoutEntry, setWorkoutEntry] = useState<WorkoutEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPressOut={() => setIsEditMode(prev => !prev)}>
          <MaterialCommunityIcons name={isEditMode ? "close" : "pencil"} size={24} />
        </TouchableOpacity>
      )
    })
  }, [navigation, isEditMode]);
  const handleDelete = (index: number) => {
    if (workoutEntry) {
      const newExercises = [...workoutEntry.exercises];
      newExercises.splice(index, 1);
      const newWorkoutEntry = { ...workoutEntry, exercises: newExercises };
      updateWorkout(newWorkoutEntry).then(updatedWorkout => {
        setWorkoutEntry(newWorkoutEntry);
        showToastInfo('Exercise removed.');
      }).catch(console.log);
    }
  }
  useEffect(() => {
    getWorkout(route.params.workout._id).then(w => setWorkoutEntry(w));
  }, []);
  const handleLogExercise = (exerciseName: string) => {
    navigation.navigate('ExerciseLog', { name: exerciseName })
  }
  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {workoutEntry?.exercises.map((exerciseName, index) => (
          <View key={index} style={styles.entryContainer}>
            <BouncyCheckbox />
            <TouchableOpacity onPress={() => handleLogExercise(exerciseName)}>
              <Text style={styles.entryText}>{convertFromDatabaseFormat(exerciseName)}</Text>
            </TouchableOpacity>
            {isEditMode && (
              <TouchableOpacity onPress={() => handleDelete(index)} style={styles.deleteButton}>
                <MaterialCommunityIcons name="delete" size={24} color="red" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      {isEditMode && (
        <FloatingActionButton onPress={() => {}} />
      )}
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
      </CustomModal>
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
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    flexDirection: 'row',
  },
  entryText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginLeft: 16,
  },
});
export default WorkoutScreen;
