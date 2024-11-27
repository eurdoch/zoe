import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
} from 'react-native';
import ScatterPlot from './ScatterPlot';

import { getExerciseDataByName, getExerciseNames } from './exercises/network';
import { convertFromDatabaseFormat, mapEntriesToDataPoint } from './utils';
import ExerciseSelect from './ExerciseSelect';
import DropdownItem from './types/DropdownItem';
import DataPoint from './types/DataPoint';
import Exercise from './types/Exercise';

function App(): React.JSX.Element {
  const [exercises, setExercises] = useState<DropdownItem[]>([])
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);
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
      { data && currentExercise && <ScatterPlot data={data} title={currentExercise.label} /> }
      { exercises && <ExerciseSelect setCurrentExercise={setCurrentExercise} handleSelect={handleSelect} items={exercises} />}
    </SafeAreaView>
  );
}

export default App;
