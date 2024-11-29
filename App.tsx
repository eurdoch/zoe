import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseLogScreen from './ExerciseLogScreen';
import HomeScreen from './HomeScreen';
import ExerciseListScreen from './ExerciseListScreen';
import ExerciseScreen from './ExerciseScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home"
          component={HomeScreen}
          options={{title: "Home"}}
        />
        <Stack.Screen
          name="ExerciseLog"
          component={ExerciseLogScreen}
          options={{title: "Log"}}
        />
        <Stack.Screen
          name="ExerciseList"
          component={ExerciseListScreen}
          options={{title: "List"}}
        />
        <Stack.Screen
          name="Exercise"
          component={ExerciseScreen}
          options={{title: "Exercise"}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
