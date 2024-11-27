import React, { useEffect, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import ScatterPlot from './ScatterPlot';

import { getExerciseDataByName, getExerciseNames } from './exercises/network';
import { convertFromDatabaseFormat, mapEntriesToDataPoint } from './utils';
import ExerciseSelect from './ExerciseSelect';
import DropdownItem from './types/DropdownItem';
import DataPoint from './types/DataPoint';

function App(): React.JSX.Element {
  const [exercises, setExercises] = useState<DropdownItem[]>([])
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    getExerciseNames()
      .then(names => {
        const items = names.map(name => ({
          label: convertFromDatabaseFormat(name),
          value: name,
        }));
        setExercises(items);
      })
      .catch(console.log);
  }, []);

  const handleSelect = async (item: DropdownItem) => {
    const exerciseData = await getExerciseDataByName(item.value);
    const dataPoints = mapEntriesToDataPoint(exerciseData);
    setData(dataPoints);
  }

  return (
    <SafeAreaView>
      {data && <ScatterPlot data={data} /> }
      { exercises && <ExerciseSelect handleSelect={handleSelect} items={exercises} />}
    </SafeAreaView>
  );
}

export default App;
