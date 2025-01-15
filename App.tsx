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
import SupplementScreen from './screens/SupplementsScreen';
import BarcodeScanner from './components/BarcodeScanner';
import NutritionLabelParser from './components/NutritionLabelParser.tsx';
import { Realm, RealmProvider } from '@realm/react';
import ExerciseEntry from './types/ExerciseEntry.ts';
import WorkoutEntry from './types/WorkoutEntry.ts';

type RootStackParamList = {
  Home: undefined;
  ExerciseLog: undefined;
  Exercise: { title: string };
  Diet: undefined;
  DietLog: { productResponse?: any, photo?: any },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define the Realm schema for WorkoutEntry
class WorkoutEntrySchema extends Realm.Object<WorkoutEntry> {
  _id!: string;
  name!: string;
  exercises!: string[];

  static schema = {
    name: 'WorkoutEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      exercises: 'string[]',
    },
  };
}

// Define the Realm schema for ExerciseEntry
class ExerciseEntrySchema extends Realm.Object<ExerciseEntry> {
  _id!: string;
  name!: string;
  weight!: number;
  reps!: number;
  createdAt!: number;
  notes!: string;

  static schema = {
    name: 'ExerciseEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      weight: 'double',
      reps: 'int',
      createdAt: 'int',
      notes: 'string',
    },
  };
}

const App = () => {
  return (
    <RealmProvider
      schema={[
      ExerciseEntrySchema,
      WorkoutEntrySchema,
      ]}
      schemaVersion={2} // Increment the version number
      migration={(oldRealm, newRealm) => {
        // If you're deleting the date field completely
        oldRealm.objects('WorkoutEntry').forEach(oldObject => {
          const newObject = newRealm.objects('WorkoutEntry').filtered('_id == $0', oldObject._id)[0];
          if (newObject) {
            // Handle migration of other fields if needed
          }
        });
      }}
    >
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
              name="NutritionLabelParser"
              component={NutritionLabelParser}
              options={{
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast />
      </RealmProvider>
  );
};

export default App;
