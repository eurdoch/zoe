import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, TouchableOpacity, View } from 'react-native';
import FoodEntry from './types/FoodEntry';
import { getFoodByUnixTime } from './network/food';

const DietScreen = () => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])

  useEffect(() => {
    const today = Date.now();
    getFoodByUnixTime(today).then(entries => {
      console.log(entries);
    });
  });

  // TODO add dropdown menu with search so dropdown is filled with search results on autocomplete
  return (
    <View style={styles.container}>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

export default DietScreen;
