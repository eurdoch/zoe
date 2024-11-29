import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseLogScreen from './ExerciseLogScreen';
import HomeScreen from './HomeScreen';
import ExerciseListScreen from './ExerciseListScreen';
import ExerciseScreen from './ExerciseScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  ExerciseLog: undefined;
  ExerciseList: undefined;
  Exercise: { title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
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
          name="Exercise"
          component={ExerciseScreen}
          options={({ route }: NativeStackScreenProps<RootStackParamList, 'Exercise'>) => ({
            title: route.params.title,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
