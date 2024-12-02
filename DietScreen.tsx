import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import FoodEntry from './types/FoodEntry';
import { getFoodByUnixTime } from './network/food';
import FloatingActionButton from './FloatingActionButton';
import DietLogScreen from './DietLogScreen';

const DietScreen = () => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [logActive, setLogActive] = useState<boolean>(false);
  const [totalCalories, setTotalCalories] = useState<number | null>(null);

  useEffect(() => {
    const today = Date.now();
    getFoodByUnixTime(today).then(entries => {
      let count = 0;
      entries.forEach(entry => {
        count += entry.macros.calories;
      });
      setTotalCalories(count);
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
            <Text>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            <Text>Total Calories: {totalCalories} </Text>
            {foodEntries.map((entry, index) => (
              <ScrollView key={index}>
                <Text>{entry.name}</Text>
                <Text>{entry.macros.calories}</Text>
              </ScrollView>
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
