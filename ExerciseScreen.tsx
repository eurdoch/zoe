import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

interface ExerciseScreenProps {
  navigation: any;
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Button
        title="Log"
        onPress={() => navigation.navigate('ExerciseLog')}
      />
      <Button
        title="Full List"
        onPress={() => navigation.navigate('ExerciseList')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
});

export default ExerciseScreen;
