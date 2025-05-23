import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View, Text } from 'react-native';
import HeaderLogo from './components/HeaderLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExerciseLogScreen from './screens/ExerciseLogScreen';
import HomeScreen, { handleLogout, HomeScreenHeaderRight } from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import ExerciseScreen from './screens/ExerciseScreen';
import DietScreen from './screens/DietScreen';
import Toast from 'react-native-toast-message';
import { getUser } from './network/user';
import { AuthenticationError } from './errors/NetworkError';
import DietLogScreen from './screens/DietLogScreen';
import CreateWorkoutScreen from './screens/CreateWorkoutScreen';
import WorkoutsScreen from './screens/WorkoutsScreen.tsx';
import { convertFromDatabaseFormat } from './utils';
import WorkoutScreen from './screens/WorkoutScreen';
import WeightScreen from './screens/WeightScreen';
import SupplementScreen from './screens/SupplementsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import BarcodeScanner from './components/BarcodeScanner';
import FoodImageAnalyzer from './components/FoodImageAnalyzer.tsx';
import 'react-native-get-random-values';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry, Icon } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { FoodDataProvider } from './contexts/FoodDataContext';

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
  Profile: undefined;
  PrivacyPolicy: undefined;
  BarcodeScanner: undefined;
  FoodImageAnalyzer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Check for token in AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          try {
            // Validate token by fetching user data
            const user = await getUser(token);
            
            // Save user data to AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(user));
            
            console.log('Token validated, user is logged in');
            setUserLoggedIn(true);
          } catch (error) {
            console.error('Token validation failed:', error);
            
            // If it's an authentication error, clear storage
            if (error instanceof AuthenticationError) {
              console.log('Invalid token, clearing storage');
              await AsyncStorage.multiRemove(['user', 'token', 'currentUser']);
            }
            
            setUserLoggedIn(false);
          }
        } else {
          // No token found, clear storage for good measure
          console.log('No token found, clearing storage');
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
        <FoodDataProvider>
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
                options={({ navigation }) => ({
                  headerTitle: () => <HeaderLogo />,
                  headerTitleAlign: "center",
                  headerRight: () => (
                    <HomeScreenHeaderRight navigation={navigation} />
                  ),
                })}
              />
              <Stack.Screen
                name="ExerciseLog"
                component={ExerciseLogScreen}
                options={{
                  title: "Log",
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
                  title: "Lifts",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="CreateWorkout"
                component={CreateWorkoutScreen}
                options={{
                  title: "Create Workout",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="Workouts"
                component={WorkoutsScreen}
                options={{
                  title: "Workouts",
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
                  title: "Weight",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="Supplement"
                component={SupplementScreen}
                options={{
                  title: "Supplements",
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
                name="FoodImageAnalyzer"
                component={FoodImageAnalyzer}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  title: "profile",
                  headerTitleAlign: "center",
                }}
              />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{
                  title: "Privacy Policy",
                  headerTitleAlign: "center",
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </FoodDataProvider>
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
