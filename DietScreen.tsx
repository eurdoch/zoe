import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FoodEntry from './types/FoodEntry';
import { getFoodByUnixTime } from './network/food';
import FloatingActionButton from './FloatingActionButton';
import DietLogScreen from './DietLogScreen';

const DietScreen = () => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [logActive, setLogActive] = useState<boolean>(false);

  useEffect(() => {
    const today = Date.now();
    getFoodByUnixTime(today).then(entries => {
      console.log(entries);
      setFoodEntries(entries);
    });
  }, [logActive]); // reload when switch back

  // TODO add dropdown menu with search so dropdown is filled with search results on autocomplete
  return (
    <View style={styles.rootContainer}>
      { logActive ?
        <DietLogScreen />
        :
        <>
          <View style={styles.container}>
            {foodEntries.map((entry, index) => (
              <View key={index}>
                <Text>{entry.food_name}</Text>
                <Text>{entry.serving_amount}</Text>
              </View>
            ))}
          </View>
          <FloatingActionButton onPress={() => {}} />
        </>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  rootContainer: {
    flex: 1,
  }
});

export default DietScreen;
