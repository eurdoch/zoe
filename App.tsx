import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseLogScreen from './screens/ExerciseLogScreen';
import HomeScreen from './screens/HomeScreen';
import ExerciseScreen from './screens/ExerciseScreen';
import DietScreen from './screens/DietScreen';
import { ModalProvider } from './modals/ModalContext';
import GlobalModal from './modals/GlobalModal';
import Toast from 'react-native-toast-message';
import DietLogScreen from './screens/DietLogScreen';
import CreateWorkoutScreen from './screens/CreateWorkoutScreen';
import StartWorkoutScreen from './screens/StartWorkoutScreen';
import { convertFromDatabaseFormat } from './utils';
import WorkoutScreen from './screens/WorkoutScreen';
import WeightScreen from './screens/WeightScreen';
import { PaperProvider } from 'react-native-paper';
import SupplementScreen from './screens/SupplementsScreen';

type RootStackParamList = {
  Home: undefined;
  ExerciseLog: undefined;
  Exercise: { title: string };
  Diet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <ModalProvider>
      <PaperProvider>
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
            <Stack.Screen
              name="Supplement"
              component={SupplementScreen}
              options={{
                title: "Supplements",
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
