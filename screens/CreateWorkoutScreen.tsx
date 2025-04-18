import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { 
  Layout, 
  Text, 
  Input, 
  Button, 
  CheckBox, 
  Card, 
  Divider,
  List,
  ListItem
} from '@ui-kitten/components';
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
  }, [realm]); // Add dependency array to prevent continuous re-rendering

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
      style={[
        styles.listItem,
        selectedExercises.includes(exercise) && styles.selectedItem
      ]}
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
      
      <Card style={styles.exercisesCard}>
        <Text category="h6" style={styles.cardTitle}>Select Exercises</Text>
        <Divider style={styles.divider} />
        <List
          data={availableExercises}
          renderItem={({ item, index }) => renderExerciseItem(item, index)}
          style={styles.list}
        />
      </Card>
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
  exercisesCard: {
    flex: 1,
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
    marginBottom: 8,
  },
  list: {
    maxHeight: '100%',
  },
  listItem: {
    borderRadius: 4,
    marginVertical: 4,
  },
  selectedItem: {
    backgroundColor: '#eafbea',
  },
});

export default CreateWorkoutScreen;
