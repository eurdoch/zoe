
import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, Button, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MouselessButton from '../components/MouselessButton';
import Menu from '../components/Menu';
type HomeScreenProps = {
  navigation: NavigationProp<any>;
};
const menuItems = [
  {
    label: "Exercise",
    screenName: "Exercise",
  },
  {
    label: "Diet",
    screenName: "Diet",
  },
  {
    label: "Weight",
    screenName: "Weight",
  },
  {
    label: "Supplements",
    screenName: "Supplement",
  },
]
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handlePress = (screen: string) => {
    navigation.navigate(screen);
  };
  return (
    <SafeAreaView style={styles.container}>
      <Menu 
        menuItems={menuItems}
        navigation={navigation}
      />
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
