import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseLogScreen from './screens/ExerciseLogScreen';
import HomeScreen from './screens/HomeScreen';
import ExerciseScreen from './screens/ExerciseScreen';
import DietScreen from './screens/DietScreen';
import Toast from 'react-native-toast-message';
import DietLogScreen from './screens/DietLogScreen';
import CreateWorkoutScreen from './screens/CreateWorkoutScreen';
import WorkoutsScreen from './screens/WorkoutsScreen.tsx';
import { convertFromDatabaseFormat } from './utils';
import WorkoutScreen from './screens/WorkoutScreen';
import WeightScreen from './screens/WeightScreen';
import { PaperProvider } from 'react-native-paper';
import SupplementScreen from './screens/SupplementsScreen';
import BarcodeScanner from './components/BarcodeScanner';
import AnalysisScreen from './screens/Analysis';
type RootStackParamList = {
  Home: undefined;
  ExerciseLog: undefined;
  Exercise: { title: string };
  Diet: undefined;
};
const Stack = createNativeStackNavigator<RootStackParamList>();
const App = () => {
  return (
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              animation: 'slide_from_right',
            }}
          >
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
                title: "Diet Log"
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
              name="Workouts"
              component={WorkoutsScreen}
              options={{
                title: "Workouts",
              }}
            />
            <Stack.Screen
              name="Workout"
              component={WorkoutScreen}
              options={({ route }) => ({ 
                title: convertFromDatabaseFormat(route.params?.workout.name),
              })}
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
            <Stack.Screen
              name="BarcodeScanner"
              component={BarcodeScanner}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Analysis"
              component={AnalysisScreen}
              options={{
                title: "Analysis"
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </PaperProvider>
  );
};
export default App;
