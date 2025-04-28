import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity } from 'react-native';
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
import LinearGradient from 'react-native-linear-gradient';
import { getExerciseNames } from '../network/exercise';
import { convertFromDatabaseFormat, showToastError } from '../utils';
import { postWorkout } from '../network/workout';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import { useRealm } from '@realm/react';

interface CreateWorkoutScreenProps {
  navigation: any;
}

const CreateWorkoutScreen = ({ navigation }: CreateWorkoutScreenProps) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [availableExercises, setAvailableExercises] = useState<string[]>([]);
  const [workoutName, setWorkoutName] = useState<string>('');
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputHeight = 150; // Approximate height of the input container

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

  useEffect(() => {
    getExerciseNames()
      .then((names: string[]) => {
        setAvailableExercises(names);
      })
      .catch(error => {
        console.error('Error fetching exercise names:', error);
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not load exercises. Please try again.');
        }
      });
  }, [handleAuthError]); // Add handleAuthError to dependency array

  const handleWorkoutPress = (workout: string) => {
    if (selectedExercises.includes(workout)) {
      setSelectedExercises(selectedExercises.filter((item) => item !== workout));
    } else {
      setSelectedExercises([...selectedExercises, workout]);
    }
  };
  
  // Animation control functions
  const showNewExerciseInput = () => {
    // Start the slide-in animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const hideNewExerciseInput = () => {
    // Start the slide-out animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
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
    
    // Reset input and start the animation to hide
    setNewExerciseName('');
    hideNewExerciseInput();
    
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

    try {
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
    } catch (error) {
      console.error('Error adding workout:', error);
      if (error instanceof AuthenticationError) {
        handleAuthError(error);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Whoops!',
          text2: 'Workout could not be saved, please try again.'
        })
      }
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
          size="large"
        />
        <LinearGradient
          colors={['#444444', '#222222']}
          style={styles.gradientContainer}
        >
          <Button 
            style={[styles.addButton, { backgroundColor: 'transparent' }]}
            onPress={handleAddWorkout}
            appearance="filled"
            size="large"
          >
            <Text style={styles.buttonText}>Add Workout</Text>
          </Button>
        </LinearGradient>
      </Card>
      
      <View style={styles.exerciseHeader}>
        <Text category="h6" style={styles.headerTitle}>Select Exercises</Text>
        <TouchableOpacity
          style={styles.addIconButton}
          onPress={showNewExerciseInput}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.iconGradient}
          >
            <Icon
              name='plus-outline'
              width={20}
              height={20}
              fill="white"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <Animated.View 
        style={[
          styles.animatedContainer, 
          {
            maxHeight: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, inputHeight]
            }),
            opacity: slideAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
      >
        <Card style={styles.newExerciseInputContainer}>
          <Input
            placeholder="Enter new exercise name"
            value={newExerciseName}
            onChangeText={setNewExerciseName}
            style={styles.newExerciseInput}
          />
          <View style={styles.newExerciseButtons}>
            <LinearGradient
              colors={['#444444', '#222222']}
              style={[styles.gradientContainer, { flex: 1 }]}
            >
              <Button
                style={[styles.addExerciseButton, { backgroundColor: 'transparent' }]}
                onPress={handleAddNewExercise}
                appearance="filled"
                size="medium"
              >
                <Text style={styles.buttonText}>Add</Text>
              </Button>
            </LinearGradient>
          </View>
        </Card>
      </Animated.View>
      
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
    borderRadius: 15,
  },
  gradientContainer: {
    marginTop: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    marginTop: 0,
    height: 50,
    borderRadius: 15,
    borderWidth: 0,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    paddingHorizontal: 8,
  },
  headerTitle: {
    textAlign: 'center',
    flex: 1,
  },
  addIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedContainer: {
    overflow: 'hidden',
    marginBottom: 16,
  },
  newExerciseInputContainer: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newExerciseInput: {
    marginBottom: 8,
    borderRadius: 15,
  },
  newExerciseButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  addExerciseButton: {
    height: 45,
    borderRadius: 15,
    borderWidth: 0,
    backgroundColor: 'transparent',
    width: '100%',
  },
});

export default CreateWorkoutScreen;
