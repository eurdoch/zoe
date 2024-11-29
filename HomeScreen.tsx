import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          title="Log"
          onPress={() => {
            navigation.navigate("ExerciseLog");
          }}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="List"
          onPress={() => {
            navigation.navigate("ExerciseList");
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
});

export default HomeScreen;
