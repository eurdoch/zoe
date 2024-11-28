import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  Button,
} from 'react-native';
import ScatterPlot from './ScatterPlot';

import { getExerciseDataByName, getExerciseNames, postExercise } from './exercises/network';
import { convertFromDatabaseFormat, getExercisesByNameAndConvertToDataPoint, mapEntriesToDataPoint } from './utils';
import ExerciseSelect from './ExerciseSelect';
import DropdownItem from './types/DropdownItem';
import DataPoint from './types/DataPoint';

function App(): React.JSX.Element {
  const [exercises, setExercises] = useState<DropdownItem[]>([])
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);

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
    const dataPoints = await getExercisesByNameAndConvertToDataPoint(item.value);
    setData(dataPoints);
  }

  const handleAddDataPoint = async (e: any) => {
    if (selectedItem) {
      const newExercise = {
        name: selectedItem.value,
        weight,
        reps
      }
      const insertedEntry = await postExercise(newExercise);
      if (insertedEntry._id) {
        setData(await getExercisesByNameAndConvertToDataPoint(insertedEntry.name));
        setReps(0);
        setWeight(0);
      } else {
        // TODO handle failure, alert user
      }
    }
  }

  return (
    <SafeAreaView>
      { data && selectedItem && <ScatterPlot data={data} title={selectedItem.label} /> }
      { exercises && <ExerciseSelect selectedItem={selectedItem} setSelectedItem={setSelectedItem} handleSelect={handleSelect} items={exercises} />}
      { selectedItem && (
        <View>
          <TextInput
            placeholder="Weight"
            value={weight.toString()}
            onChangeText={(text) => setWeight(parseFloat(text))}
          />
          <TextInput
            placeholder="Reps"
            value={reps.toString()}
            onChangeText={(text) => setReps(parseInt(text, 10))}
          />
          <Button title="Add" onPress={handleAddDataPoint} />
        </View>
      )}
    </SafeAreaView>
  );
}

export default App;

