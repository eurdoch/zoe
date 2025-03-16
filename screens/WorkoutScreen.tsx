import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Button, TextInput } from 'react-native';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkout, updateWorkout, deleteWorkout } from '../network/workout';
import { convertFromDatabaseFormat, convertToDatabaseFormat, showToastError, showToastInfo } from '../utils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FloatingActionButton from '../components/FloatingActionButton';
import CustomModal from '../CustomModal';
import ExerciseDropdown from '../components/ExerciseDropdown';
import DropdownItem from '../types/DropdownItem';
import { getExerciseNames } from '../network/exercise';
import { useRealm } from '@realm/react';

interface WorkoutScreenProps {
  navigation: any;
  route: any;
}

const WorkoutScreen = ({ navigation, route }: WorkoutScreenProps) => {
  const [workoutEntry, setWorkoutEntry] = useState<WorkoutEntry | null>(null);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const realm = useRealm();

  const handleDeleteWorkout = () => {
    deleteWorkout(route.params.workout._id, realm).then(() => navigation.goBack());
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.rightHeader}>
          {isEditMode && (
            <TouchableOpacity onPressOut={handleDeleteWorkout}>
              <MaterialCommunityIcons name="delete" size={24} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPressOut={() => setIsEditMode(prev => !prev)}>
            <MaterialCommunityIcons name={isEditMode ? "close" : "pencil"} size={24} />
          </TouchableOpacity>
        </View>
      )
    })
  }, [navigation, isEditMode]);

  const handleDeleteExercise = (index: number) => {
    if (workoutEntry) {
      const newExercises = [...workoutEntry.exercises];
      newExercises.splice(index, 1);
      const newWorkoutEntry = { ...workoutEntry, exercises: newExercises };
      updateWorkout(newWorkoutEntry, realm).then(updatedWorkout => {
        setWorkoutEntry(updatedWorkout);
        showToastInfo('Exercise removed.');
      }).catch(console.log);
    }
  }

  useEffect(() => {
    getWorkout(route.params.workout._id, realm).then(w => setWorkoutEntry(w));
    getExerciseNames(realm)
      .then(names => {
        const sortedNames = names
          .sort((a, b) => a.localeCompare(b)).map(name => ({
            label: convertFromDatabaseFormat(name),
            value: name,
          }));
        setDropdownItems([
          {
            value: 'new_exercise',
            label: 'Add New Exercise'
          }, 
          ...sortedNames
        ]);
      })
      .catch(err => {
        showToastError('Could not get exercises, please try again.');
        console.log(err);
      });
  }, []);

  const handleLogExercise = (exerciseName: string) => {
    navigation.navigate('ExerciseLog', { name: exerciseName })
  }

  const handleAddToWorkout = (_e: any) => {
    if (selectedItem && workoutEntry) {
      const newWorkoutEntry = {
        _id: workoutEntry._id,
        name: workoutEntry.name,
        exercises: [
          ...workoutEntry.exercises, 
          selectedItem.value === 'new_exercise' ? 
            convertToDatabaseFormat(newExerciseName) : selectedItem.value
        ],
        createdAt: Math.floor(Date.now() / 1000)
      };
      try {
        updateWorkout(newWorkoutEntry, realm).then(result => {
          setWorkoutEntry(newWorkoutEntry);
        });
      } catch (_e: any) {
        showToastError('Exercise could not be added, try again.');
      }
    }
    setIsEditMode(false);
    setSelectedItem(undefined);
    setNewExerciseName('');
    setModalVisible(false);
  }

  const handleDropdownChange = (item: DropdownItem) => {
    if (item.value === 'new_exercise') {
      setSelectedItem({
        value: 'new_exercise',
        label: 'Add New Exercise',
      });
    } else {
      setSelectedItem(item);
      setNewExerciseName('');
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {workoutEntry?.exercises.map((exerciseName, index) => (
          <View key={index} style={styles.entryContainer}>
            <TouchableOpacity onPress={!isEditMode ? () => handleLogExercise(exerciseName) : () => {}}>
              <Text style={styles.entryText}>{convertFromDatabaseFormat(exerciseName)}</Text>
            </TouchableOpacity>
            {isEditMode && (
              <TouchableOpacity onPress={() => handleDeleteExercise(index)} style={styles.deleteButton}>
                <MaterialCommunityIcons name="delete" size={24} color="red" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      {isEditMode && (
        <FloatingActionButton onPress={() => setModalVisible(true)} />
      )}
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        {selectedItem && selectedItem.value === 'new_exercise' ? (
          <TextInput
            style={styles.input}
            value={newExerciseName}
            onChangeText={setNewExerciseName}
            placeholder="Enter new exercise name"
          />
        ) : (
          <ExerciseDropdown onChange={handleDropdownChange} dropdownItems={dropdownItems} selectedItem={selectedItem} />
        )}
        <Button 
          title="Add Exercise" 
          onPress={handleAddToWorkout} 
        />
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
  input: {
    height: 50,
    borderWidth: 1,
    padding: 10,
    paddingLeft: 15,
    marginVertical: 8,
  },
  rightHeader: {
    flexDirection: 'row',
    gap: 10,
  }
});
export default WorkoutScreen;

