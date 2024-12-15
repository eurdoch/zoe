import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  {
    label: "Analysis",
    screenName: "Analysis"
  }
]

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
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
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default HomeScreen;
