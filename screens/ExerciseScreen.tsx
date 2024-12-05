import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface ExerciseScreenProps {
  navigation: any;
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Button onPress={() => navigation.navigate('ExerciseLog')}>Log</Button>
      <Button onPress={() => navigation.navigate('CreateWorkout')}>Create Workout</Button>
      <Button onPress={() => navigation.navigate('StartWorkout')}>Start Workout</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
});

export default ExerciseScreen;
