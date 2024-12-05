import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import FoodEntry from '../types/FoodEntry';
import { getFoodByUnixTime } from '../network/food';
import FloatingActionButton from '../components/FloatingActionButton';
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
          <View style={styles.headerContainer}>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            <Text style={styles.totalCalories}>Total Calories: {totalCalories} </Text>
          </View>
          <ScrollView style={styles.foodEntryList}>
            {foodEntries.map((entry, index) => (
              <View key={index} style={styles.foodEntry}>
                <Text>{entry.name}</Text>
                <Text>{entry.macros.calories}</Text>
              </View>
            ))}
          </ScrollView>
          <FloatingActionButton onPress={() => setLogActive(true)} />
        </>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    padding: 10,
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalCalories: {
    fontSize: 16,
    marginTop: 5,
  },
  foodEntryList: {
    flex: 1,
    padding: 10,
  },
  foodEntry: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    marginBottom: 10,
  },
  rootContainer: {
    flex: 1,
  }
});

export default DietScreen;
