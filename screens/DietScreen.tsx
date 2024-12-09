import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import FoodEntry from '../types/FoodEntry';
import { deleteFood, getFoodByUnixTime } from '../network/food';
import FloatingActionButton from '../components/FloatingActionButton';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
interface DietScreenProps {
  navigation: any;
}
const DietScreen = ({ navigation }: DietScreenProps) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [totalCalories, setTotalCalories] = useState<number | null>(null);
  // TODO make sure this works when item is logged``
  useEffect(() => {
    const today = Math.floor(Date.now() / 1000);
    getFoodByUnixTime(today).then(entries => {
      let count = 0;
      entries.forEach(entry => {
        count += entry.macros.calories;
      });
      setTotalCalories(count);
      setFoodEntries(entries);
    });
  }, []);

  const handleDeleteEntry = (id: string) => {
    deleteFood(id).then(result => {
      console.log(result);
    });
  }

  // TODO add dropdown menu with search so dropdown is filled with search results on autocomplete
  return (
    <View style={styles.rootContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        <Text style={styles.totalCalories}>Total Calories: {totalCalories} </Text>
      </View>
      <ScrollView style={styles.foodEntryList}>
        {foodEntries.map((entry, index) => (
          <View key={index} style={styles.foodEntry}>
            <Text style={styles.boldFont}>{entry.name}</Text>
            <View style={styles.rightSection}>
              <Text style={{fontSize: 18}}>{entry.macros.calories}</Text>
              <TouchableOpacity onPress={() => handleDeleteEntry(entry._id)}>
                <MaterialCommunityIcons name="delete" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <FloatingActionButton onPress={() => navigation.navigate('DietLog')} />
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
  boldFont: {
    fontWeight: 'bold',
    fontSize: 18,
    flexShrink: 1,
  },
  foodEntryList: {
    flex: 1,
    padding: 10,
  },
  foodEntry: {
    gap: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightSection: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rootContainer: {
    flex: 1,
  }
});
export default DietScreen;
