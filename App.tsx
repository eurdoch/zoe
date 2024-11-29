import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExerciseLogScreen from './ExerciseLogScreen';
import HomeScreen from './HomeScreen';
import ExerciseListScreen from './ExerciseListScreen';

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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
