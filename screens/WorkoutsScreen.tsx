import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Layout, 
  Button, 
  Text, 
  Card, 
  List, 
  Icon 
} from '@ui-kitten/components';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkouts } from '../network/workout';
import { useFocusEffect } from '@react-navigation/native';
import { useRealm } from '@realm/react';

interface WorkoutsScreenProps {
  navigation: any;
}

const WorkoutsScreen = ({ navigation }: WorkoutsScreenProps) => {
  const realm = useRealm();
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  // For navigation to and back to
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = getWorkouts(realm).then(ws => setWorkoutEntries(ws));
      return () => unsubscribe;
    }, [])
  );

  const handleStartWorkout = (entry: WorkoutEntry) => {
    navigation.navigate('Workout', { workout: entry })
  }

  const renderAddButton = () => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props: any) => <Icon {...props} name="plus-outline" />}
      onPress={() => navigation.navigate('CreateWorkout')}
    />
  );

  return (
    <Layout style={styles.container}>
      <Layout style={styles.buttonContainer}>
        {workoutEntries.map(entry => (
          <Button
            key={entry._id}
            style={styles.workoutButton}
            appearance="filled"
            status="primary"
            size="large"
            onPress={() => handleStartWorkout(entry)}
          >
            {entry.name}
          </Button>
        ))}
      </Layout>
      {renderAddButton()}
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
  workoutButton: {
    marginVertical: 8,
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
});

export default WorkoutsScreen;
