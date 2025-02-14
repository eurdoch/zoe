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
  // TODO broken for now
  //{
  //  label: "Diet",
  //  screenName: "Diet",
  //},
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
  //const realm = useRealm();
  //async function syncDataFromServer() {
  //  try {
  //    // 1. Fetch data from your MongoDB server endpoint
  //    const response = await fetch('https://directto.link/workout', {
  //      method: 'GET',
  //      headers: {
  //        'Content-Type': 'application/json',
  //      }
  //    });

  //    if (!response.ok) {
  //      throw new Error(`HTTP error! status: ${response.status}`);
  //    }
  //    
  //    const serverData = await response.json();
  //    console.log(serverData);

  //    // 3. Write all data to Realm
  //    realm.write(() => {
  //      serverData.forEach(item => {
  //        // Convert MongoDB ObjectId to Realm ObjectId if needed
  //        if (item._id.$oid) {
  //          item._id = new Realm.BSON.ObjectId(item._id.$oid);
  //        }
  //        
  //        // Create or update in Realm
  //        realm.create('WorkoutEntry', item);
  //        console.log('Susccessfully downloaded wweight edntry to local storage.');
  //      });
  //    });
  //  } catch (error) {
  //    console.error('Sync failed:', error);
  //    throw error;
  //  }
  //}

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
