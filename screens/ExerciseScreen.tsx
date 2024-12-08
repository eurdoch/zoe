import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Menu from '../components/Menu';
interface ExerciseScreenProps {
  navigation: any;
}
const menuItems = [
  {
    label: "Log",
    screenName: "ExerciseLog",
  },
  {
    label: "Create Workout",
    screenName: "CreateWorkout",
  },
  {
    label: "Start Workout",
    screenName: "StartWorkout",
  }
]
const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Menu menuItems={menuItems} navigation={navigation} />
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
    gap: 10,
  },
});
export default ExerciseScreen;
