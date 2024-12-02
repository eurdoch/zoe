import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';

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
        <Button onPress={() => handlePress('Exercise')}>Exercise</Button>
        <Button onPress={() => handlePress('Diet')}>
          Diet
        </Button>
        <Button onPress={() => handlePress('Weight')}>
          Weight
        </Button>
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
