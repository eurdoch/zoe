import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Button } from 'react-native';
import FoodEntry from '../types/FoodEntry';
import { deleteFood, getFoodByUnixTime } from '../network/food';
import FloatingActionButton from '../components/FloatingActionButton';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { showToastError, showToastInfo } from '../utils';
import CustomModal from '../CustomModal';
import NutritionInfo from '../types/NutritionInfo';
import MacroByLabelCalculator from '../components/MacroByLabelCalculator';

interface DietScreenProps {
  navigation: any;
  route: any;
}

const DietScreen = ({ navigation, route }: DietScreenProps) => {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [totalCalories, setTotalCalories] = useState<number | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<FoodEntry | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(null);

  const loadData = () => {
    const today = Math.floor(Date.now() / 1000);
    getFoodByUnixTime(today).then(entries => {
      console.log('entries', entries);
      let count = 0;
      entries.forEach(entry => {
        count += entry.macros.calories;
      });
      setTotalCalories(count);
      setFoodEntries(entries);
    });
  }

  useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        loadData();
        if (route.params?.nutritionInfo) {
          setNutritionInfo(route.params.nutritionInfo);
          setDeleteEntry(null);
          setModalVisible(true);
        }
      });

      return unsubscribe;
  }, [navigation]);

  const handleDeleteEntry = (id: string) => {
    deleteFood(id).then(result => {
      if (result.acknowledged) {
        showToastInfo('Food entry deleted.');
        loadData();
      } else {
        showToastError('Food entry could not be deleted, try again.');
      }
    });
    setModalVisible(false);
    setDeleteEntry(null);
  }

  const checkDelete = (entry: FoodEntry) => {
    setDeleteEntry(entry);
    setModalVisible(true);
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
              <TouchableOpacity onPress={() => checkDelete(entry)}>
                <MaterialCommunityIcons name="delete" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <FloatingActionButton onPress={() => navigation.navigate('DietLog')} />
      <CustomModal
        visible={modalVisible}
        setVisible={setModalVisible}
      >
        { 
          deleteEntry && (
            <View>
              <Text>Delete entry?</Text>
              <Text>{deleteEntry.name + ' ' + deleteEntry.macros.calories}</Text>
              <Button title="DELETE" onPress={() => handleDeleteEntry(deleteEntry._id)} />
            </View>
          )
        }
        {
          nutritionInfo && (
            <MacroByLabelCalculator loadDat={loadData} setModalVisible={setModalVisible} nutritionInfo={nutritionInfo} />
          ) 
        }
      </CustomModal>
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
