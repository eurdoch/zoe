import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExerciseLogScreen from './screens/ExerciseLogScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
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
import WeightEntry from './types/WeightEntry.ts';
import SupplementEntry from './types/SupplementEntry.ts';
import 'react-native-get-random-values';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  ExerciseLog: undefined;
  Exercise: { title: string };
  Diet: undefined;
  DietLog: { productResponse?: any, photo?: any };
  CreateWorkout: undefined;
  Workouts: undefined;
  Workout: { workout: { name: string } };
  Weight: undefined;
  Supplement: undefined;
  BarcodeScanner: undefined;
  NutritionLabelParser: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define the Realm schema for WorkoutEntry
class WorkoutEntrySchema extends Realm.Object<WorkoutEntry> {
  _id!: string;
  name!: string;
  exercises!: string[];
  createdAt!: number;

  static schema = {
    name: 'WorkoutEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      exercises: 'string[]',
      createdAt: 'int',
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

// Define the Realm schema for WeightEntry
class WeightEntrySchema extends Realm.Object<WeightEntry> {
  _id!: string;
  value!: number;
  createdAt!: number;

  static schema = {
    name: 'WeightEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      value: 'double',
      createdAt: 'int',
    },
  };
}

// Define the Realm schema for SupplementEntry
class SupplementEntrySchema extends Realm.Object<SupplementEntry> {
  _id!: string;
  name!: string;
  amount!: number;
  amount_unit!: string;
  createdAt!: number;

  static schema = {
    name: 'SupplementEntry',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      name: 'string',
      amount: 'double',
      amount_unit: 'string',
      createdAt: 'int',
    },
  };
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Check for user data in AsyncStorage
        const userData = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        
        if (userData && token) {
          // User is logged in
          console.log('User is logged in');
          setUserLoggedIn(true);
        } else {
          // No valid user data, clear storage for good measure
          console.log('No user found, clearing storage');
          await AsyncStorage.multiRemove(['user', 'token', 'currentUser']);
          setUserLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        // On error, clear storage and ensure user is logged out
        try {
          await AsyncStorage.multiRemove(['user', 'token', 'currentUser']);
        } catch (clearError) {
          console.error('Error clearing storage:', clearError);
        }
        setUserLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen
  }


  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.light}>
        <RealmProvider
          deleteRealmIfMigrationNeeded={false}
          schema={[
            ExerciseEntrySchema,
            WorkoutEntrySchema,
            WeightEntrySchema,
            SupplementEntrySchema,
          ]}
          schemaVersion={2} // Increment the version number
          onMigration={(oldRealm: any, newRealm: any) => {
            const oldWorkoutEntries = oldRealm.objects('WorkoutEntry');
            for (const oldEntry of oldWorkoutEntries) {
              const newEntry = newRealm.objectForPrimaryKey('WorkoutEntry', oldEntry._id);
              if (newEntry && !newEntry.createdAt) {
                newEntry.createdAt = Math.floor(Date.now() / 1000);
              }
            }
          }}
        >
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                animation: 'slide_from_right',
              }}
              initialRouteName={userLoggedIn ? "Home" : "Login"}
            >
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  title: "Login",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: "zotik",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="ExerciseLog"
                component={ExerciseLogScreen}
                options={{
                  title: "log",
                  headerTitleAlign: "center",
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
                  title: "exercise",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="CreateWorkout"
                component={CreateWorkoutScreen}
                options={{
                  title: "create workout",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="Workouts"
                component={WorkoutsScreen}
                options={{
                  title: "workouts",
                  headerTitleAlign: "center",
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
                  title: "weight",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="Supplement"
                component={SupplementScreen}
                options={{
                  title: "supplements",
                  headerTitleAlign: "center",
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
      </ApplicationProvider>
    </>
      
  );
};

// Styles for the app (primarily for the modal)
const appStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    color: '#555',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#f0f0f0',
  },
  buttonLogout: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonLogoutText: {
    color: 'white',
  },
});

export default App;
