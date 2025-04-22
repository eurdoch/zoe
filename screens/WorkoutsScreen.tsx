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
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToastError } from '../utils';

interface WorkoutsScreenProps {
  navigation: any;
}

const WorkoutsScreen = ({ navigation }: WorkoutsScreenProps) => {
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  // Authentication error handler
  const handleAuthError = useCallback(async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token and user from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Token and user removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (storageError) {
      console.error('Error removing data from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  }, [navigation]);

  // For navigation to and back to
  useFocusEffect(
    useCallback(() => {
      const fetchWorkouts = async () => {
        try {
          const workouts = await getWorkouts();
          setWorkoutEntries(workouts);
        } catch (error) {
          console.error('Error fetching workouts:', error);
          if (error instanceof AuthenticationError) {
            handleAuthError(error);
          } else {
            showToastError('Could not load workouts. Please try again.');
          }
        }
      };
      
      fetchWorkouts();
      
      // No cleanup function needed as we're not subscribing to anything
      return () => {};
    }, [handleAuthError])
  );

  const handleStartWorkout = (entry: WorkoutEntry) => {
    navigation.navigate('Workout', { workout: entry });
  };

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
            accessoryLeft={null}
            onPress={() => handleStartWorkout(entry)}
          >
            {evaProps => <Text {...evaProps} style={styles.buttonText}>{entry.name}</Text>}
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
    height: 60, // Make buttons taller
    borderRadius: 15, // Increased border radius
  },
  buttonText: {
    fontSize: 18, // Larger text size
    fontWeight: 'bold',
    color: 'white',
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