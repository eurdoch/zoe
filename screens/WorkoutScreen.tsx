import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, View, GestureResponderEvent } from 'react-native';
import { 
  Layout, 
  Button, 
  Card, 
  Modal, 
  Icon,
  TopNavigationAction,
  Input,
} from '@ui-kitten/components';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkout, updateWorkout, deleteWorkout } from '../network/workout';
import { convertFromDatabaseFormat, convertToDatabaseFormat, showToastError, showToastInfo } from '../utils';
import ExerciseDropdown from '../components/ExerciseDropdown';
import DropdownItem from '../types/DropdownItem';
import { getExerciseNames } from '../network/exercise';
import { useRealm } from '@realm/react';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // Function to handle authentication errors
  const handleAuthError = async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token from AsyncStorage
    try {
      await AsyncStorage.removeItem('token');
      console.log('Token removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (storageError) {
      console.error('Error removing token from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  };

  const handleDeleteWorkout = async () => {
    try {
      await deleteWorkout(route.params.workout._id, realm);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting workout:', error);
      
      if (error instanceof AuthenticationError) {
        handleAuthError(error);
      } else {
        showToastError('Could not delete workout, please try again.');
      }
    }
  }

  const DeleteIcon = (props: any) => (
    <Icon {...props} name='trash-2-outline'/>
  );
  
  const EditIcon = (props: any) => (
    <Icon {...props} name='edit-outline'/>
  );
  
  const CloseIcon = (props: any) => (
    <Icon {...props} name='close-outline'/>
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.rightHeader}>
          {isEditMode && (
            <TopNavigationAction
              icon={DeleteIcon}
              onPress={handleDeleteWorkout}
            />
          )}
          <TopNavigationAction
            icon={isEditMode ? CloseIcon : EditIcon}
            onPress={() => setIsEditMode(prev => !prev)}
          />
        </View>
      )
    })
  }, [navigation, isEditMode]);

  const handleDeleteExercise = async (index: number) => {
    if (workoutEntry) {
      try {
        const newExercises = [...workoutEntry.exercises];
        newExercises.splice(index, 1);
        const newWorkoutEntry = { ...workoutEntry, exercises: newExercises };
        
        const updatedWorkout = await updateWorkout(newWorkoutEntry, realm);
        setWorkoutEntry(updatedWorkout);
        showToastInfo('Exercise removed.');
      } catch (error) {
        console.error('Error deleting exercise from workout:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not remove exercise, please try again.');
        }
      }
    }
  }

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const w = await getWorkout(route.params.workout._id, realm);
        setWorkoutEntry(w);
      } catch (error) {
        console.error('Error loading workout:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not load workout, please try again.');
        }
      }
    };
    
    loadWorkout();
    
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
      .catch(error => {
        console.error('Error loading exercise names:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not get exercises, please try again.');
        }
      });
  }, []);

  const handleLogExercise = (exerciseName: string) => {
    navigation.navigate('ExerciseLog', { name: exerciseName })
  }

  const handleAddToWorkout = async (_e: any) => {
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
        const result = await updateWorkout(newWorkoutEntry, realm);
        setWorkoutEntry(newWorkoutEntry);
        showToastInfo('Exercise added to workout.');
      } catch (error) {
        console.error('Error adding exercise to workout:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
          return; // Stop further execution if we're redirecting to login
        } else {
          showToastError('Exercise could not be added, try again.');
        }
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

  const renderItemAccessory = (index: number) => {
    if (isEditMode) {
      return (
        <Button
          size="small"
          status="danger"
          appearance="ghost"
          accessoryLeft={(props: any) => <Icon {...props} name="trash-2-outline" />}
          onPress={() => handleDeleteExercise(index)}
        />
      );
    }
    return <></>;
  };

  const renderAddButton = () => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props: any) => <Icon {...props} name="plus-outline" />}
      onPress={() => setModalVisible(true)}
    />
  );

  return (
    <Layout style={styles.container}>
      <Layout style={styles.buttonContainer}>
        {(workoutEntry?.exercises || []).map((item, index) => (
          <Button
            key={index}
            style={styles.exerciseButton}
            appearance="filled"
            status="primary"
            size="large"
            onPress={!isEditMode ? () => handleLogExercise(item) : undefined}
            accessoryRight={
              isEditMode ? 
                (props) => (
                  <Icon 
                    {...props} 
                    name="trash-2-outline" 
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      handleDeleteExercise(index);
                    }}
                  />
                ) : undefined
            }
          >
            {convertFromDatabaseFormat(item)}
          </Button>
        ))}
      </Layout>
      
      {isEditMode && renderAddButton()}
      
      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setModalVisible(false)}
      >
        <Card disabled>
          {selectedItem && selectedItem.value === 'new_exercise' ? (
            <Input
              style={styles.input}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Enter new exercise name"
            />
          ) : (
            <ExerciseDropdown 
              onChange={handleDropdownChange} 
              dropdownItems={dropdownItems} 
              selectedItem={selectedItem} 
            />
          )}
          <Button 
            style={styles.addButton}
            onPress={handleAddToWorkout}
          >
            ADD EXERCISE
          </Button>
        </Card>
      </Modal>
    </Layout>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  exerciseButton: {
    marginVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  rightHeader: {
    flexDirection: 'row',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  floatingButton: {
    position: 'absolute',
    right: 32,
    bottom: 32,
    borderRadius: 28,
    width: 60,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addButton: {
    marginTop: 16,
  }
});
export default WorkoutScreen;

