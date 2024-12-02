import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseLogScreen from './ExerciseLogScreen';
import HomeScreen from './HomeScreen';
import ExerciseListScreen from './ExerciseListScreen';
import ExerciseScreen from './ExerciseScreen';
import DietScreen from './DietScreen';
import { ModalProvider } from './ModalContext';
import GlobalModal from './GlobalModal';
import Toast from 'react-native-toast-message';
import DietLogScreen from './DietLogScreen';
import CreateWorkoutScreen from './CreateWorkoutScreen';
import StartWorkoutScreen from './StartWorkoutScreen';
import { convertFromDatabaseFormat } from './utils';
import WorkoutScreen from './WorkoutScreen';
import WeightScreen from './WeightScreen';
import { PaperProvider } from 'react-native-paper';

type RootStackParamList = {
  Home: undefined;
  ExerciseLog: undefined;
  ExerciseList: undefined;
  Exercise: { title: string };
  Diet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <ModalProvider>
      <PaperProvider theme={{version: 2}}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: "Home"
              }}
            />
            <Stack.Screen
              name="ExerciseLog"
              component={ExerciseLogScreen}
              options={{
                title: "Log"
              }}
            />
            <Stack.Screen
              name="ExerciseList"
              component={ExerciseListScreen}
              options={{
                title: "List"
              }}
            />
            <Stack.Screen
              name="DietLog"
              component={DietLogScreen}
              options={{
                title: "Diet"
              }}
            />
            <Stack.Screen
              name="Diet"
              component={DietScreen}
              options={{
                title: "Diet"
              }}
            />
            <Stack.Screen
              name="Exercise"
              component={ExerciseScreen}
              options={{
                title: "Exercise",
              }}
            />
            <Stack.Screen
              name="CreateWorkout"
              component={CreateWorkoutScreen}
              options={{
                title: "Create Workout",
              }}
            />
            <Stack.Screen
              name="StartWorkout"
              component={StartWorkoutScreen}
              options={{
                title: "Start Workout",
              }}
            />
            <Stack.Screen
              name="Workout"
              component={WorkoutScreen}
              options={({ route }) => ({ title: convertFromDatabaseFormat(route.params?.workout.name) })}
            />
            <Stack.Screen
              name="Weight"
              component={WeightScreen}
              options={{
                title: "Weight",
              }}
            />
          </Stack.Navigator>
          <GlobalModal />
        </NavigationContainer>
        <Toast />
      </PaperProvider>
    </ModalProvider>
  );
};

export default App;
