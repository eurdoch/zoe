import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Layout, 
  Text, 
  Input, 
  Button, 
  CheckBox, 
  Card, 
  Divider,
  List,
  ListItem,
  Icon
} from '@ui-kitten/components';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat } from '../utils';
import { postWorkout } from '../network/workout';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
//import { useRealm } from '@realm/react';

interface CreateWorkoutScreenProps {
  navigation: any;
}

const CreateWorkoutScreen = ({ navigation }: CreateWorkoutScreenProps) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [workoutName, setWorkoutName] = useState<string>('');
  const [showNewExerciseInput, setShowNewExerciseInput] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');

  useEffect(() => {
    getExerciseNames().then((names: string[]) => {
      setAvailableExercises(names);
    });
  }, []); // Empty dependency array to run only once

  const handleWorkoutPress = (workout: string) => {
    if (selectedExercises.includes(workout)) {
      setSelectedExercises(selectedExercises.filter((item) => item !== workout));
    } else {
      setSelectedExercises([...selectedExercises, workout]);
    }
  };
  
  const handleAddNewExercise = () => {
    if (!newExerciseName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Whoops!',
        text2: 'Please enter an exercise name.'
      });
      return;
    }
    
    // Convert to database format (using the same convention as elsewhere)
    const formattedName = newExerciseName.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Check if exercise already exists
    if (availableExercises.includes(formattedName)) {
      Toast.show({
        type: 'error',
        text1: 'Whoops!',
        text2: 'This exercise already exists.'
      });
      return;
    }
    
    // Add to available exercises
    setAvailableExercises([...availableExercises, formattedName]);
    
    // Select the new exercise
    setSelectedExercises([...selectedExercises, formattedName]);
    
    // Reset input and hide it
    setNewExerciseName('');
    setShowNewExerciseInput(false);
    
    Toast.show({
      type: 'success',
      text1: 'Success!',
      text2: 'New exercise added.'
    });
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
    });
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

  // Icon definition for the add button
  const AddIcon = (props: any) => (
    <Icon {...props} name='plus-outline'/>
  );
  
  const renderExerciseItem = (exercise: string, index: number) => (
    <ListItem
      key={index}
      title={convertFromDatabaseFormat(exercise)}
      accessoryRight={() => (
        <CheckBox
          checked={selectedExercises.includes(exercise)}
          onChange={() => handleWorkoutPress(exercise)}
        />
      )}
      onPress={() => handleWorkoutPress(exercise)}
      style={selectedExercises.includes(exercise) ? styles.selectedItem : null}
    />
  );

  return (
    <Layout style={styles.container}>
      <Card style={styles.formCard}>
        <Text category="h6" style={styles.cardTitle}>Create New Workout</Text>
        <Input
          style={styles.input}
          placeholder="Enter workout name"
          value={workoutName}
          onChangeText={setWorkoutName}
          label="Workout Name"
          size="large"
        />
        <Button 
          style={styles.addButton}
          onPress={handleAddWorkout}
          status="primary"
        >
          ADD WORKOUT
        </Button>
      </Card>
      
      <View style={styles.exerciseHeader}>
        <Text category="h6" style={styles.headerTitle}>Select Exercises</Text>
        <Button
          appearance="ghost"
          status="primary"
          accessoryLeft={AddIcon}
          size="small"
          onPress={() => setShowNewExerciseInput(true)}
        />
      </View>
      
      {showNewExerciseInput && (
        <Card style={styles.newExerciseInputContainer}>
          <Input
            placeholder="Enter new exercise name"
            value={newExerciseName}
            onChangeText={setNewExerciseName}
            style={styles.newExerciseInput}
          />
          <View style={styles.newExerciseButtons}>
            <Button
              appearance="outline"
              status="basic"
              style={styles.cancelButton}
              onPress={() => {
                setNewExerciseName('');
                setShowNewExerciseInput(false);
              }}
            >
              CANCEL
            </Button>
            <Button
              status="success"
              style={styles.addExerciseButton}
              onPress={handleAddNewExercise}
            >
              ADD
            </Button>
          </View>
        </Card>
      )}
      
      <Divider style={styles.divider} />
      <List
        data={availableExercises}
        renderItem={({ item, index }) => renderExerciseItem(item, index)}
        style={styles.list}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  formCard: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  selectedItem: {
    backgroundColor: '#eafbea',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    textAlign: 'center',
  },
  newExerciseInputContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  newExerciseInput: {
    marginBottom: 8,
  },
  newExerciseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addExerciseButton: {
    flex: 1,
  },
});

export default CreateWorkoutScreen;
