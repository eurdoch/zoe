import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FoodEntry from './types/FoodEntry';
import { getFoodByUnixTime } from './network/food';
import FloatingActionButton from './FloatingActionButton';
import DietLogScreen from './DietLogScreen';
import { calculateNutrition } from './utils';

const DietScreen = () => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [logActive, setLogActive] = useState<boolean>(false);

  useEffect(() => {
    const today = Date.now();
    getFoodByUnixTime(today).then(entries => {
      setFoodEntries(entries);
    });
  }, [logActive]); // reload when switch back

  // TODO add dropdown menu with search so dropdown is filled with search results on autocomplete
  return (
    <View style={styles.rootContainer}>
      { logActive ?
        <DietLogScreen setLogActive={setLogActive} />
        :
        <>
          <View style={styles.container}>
            {foodEntries.map((entry, index) => (
              <View key={index}>
                <Text>{entry.name}</Text>
                <Text>{entry.macros.calories}</Text>
              </View>
            ))}
          </View>
          <FloatingActionButton onPress={() => setLogActive(true)} />
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
