import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Button, View } from 'react-native';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View>
      <Button
        title="Log"
        onPress={() => {
          navigation.navigate("ExerciseLog");
        }}
      />
    </View>
  );
};

export default HomeScreen;
