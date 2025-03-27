import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Menu from '../components/Menu';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { SYNC_ENABLED } from '../config';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const menuItems = [
  {
    label: "exercise",
    screenName: "Exercise",
  },
  // TODO broken for now
  //{
  //  label: "Diet",
  //  screenName: "Diet",
  //},
  {
    label: "weight",
    screenName: "Weight",
  },
  {
    label: "supplements",
    screenName: "Supplement",
  },
]

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Menu 
          menuItems={menuItems}
          navigation={navigation}
        />
        
        {/* Show sync status indicator only if sync is enabled */}
        {SYNC_ENABLED && <SyncStatusIndicator />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default HomeScreen;
