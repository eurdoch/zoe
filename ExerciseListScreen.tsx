import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { getExerciseDataByName, getExerciseNames } from './network/exercise';
import { convertFromDatabaseFormat, mapEntriesToDataPoint } from './utils';
import { NavigationProp } from '@react-navigation/native';

interface ExerciseListScreenProps {
  navigation: NavigationProp<any>;
}

const ExerciseListScreen = ({ navigation }: ExerciseListScreenProps) => {
  const [names, setNames] = useState<string[] | null>(null);

  const fetchData = async () => {
    const names = await getExerciseNames();
    setNames(names);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleExerciseSelect = async (name: string) => {
    const data = await getExerciseDataByName(name);
    const dataPoints = mapEntriesToDataPoint(data);
    navigation.navigate("Exercise", {
      data: dataPoints,
      title: convertFromDatabaseFormat(name),
    })
  } 

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        { names &&
          names.map((name, index) => (
            <TouchableOpacity
              key={index}
              style={styles.buttonContainer}
              onPress={() => handleExerciseSelect(name)}
            >
              <Text style={styles.buttonText}>{convertFromDatabaseFormat(name)}</Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContainer: {
    paddingVertical: 20,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ExerciseListScreen;
