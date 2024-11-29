import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Button } from 'react-native';
import { getExerciseDataByName, getExerciseNames } from './exercises/network';
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
      <ScrollView>
        { names &&
          names.map((name, index) => <Button
            key={index} 
            title={convertFromDatabaseFormat(name)}
            onPress={() => handleExerciseSelect(name)}
          />)
        }
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExerciseListScreen;
