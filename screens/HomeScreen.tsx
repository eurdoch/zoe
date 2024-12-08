
import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, Button, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MouselessButton from '../components/MouselessButton';
type HomeScreenProps = {
  navigation: NavigationProp<any>;
};
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handlePress = (screen: string) => {
    navigation.navigate(screen);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonContainer}>
        <MouselessButton onPress={() => handlePress('Exercise')}>Exercise</MouselessButton>
        <MouselessButton onPress={() => handlePress('Diet')}>Diet</MouselessButton>
        <MouselessButton onPress={() => handlePress('Weight')}>Weight</MouselessButton>
        <MouselessButton onPress={() => handlePress('Supplement')}>Supplements</MouselessButton>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    gap: 10,
    marginHorizontal: 16,
  },
});

export default HomeScreen;
