import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  Button,
  StyleSheet,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import ScatterPlot from './ScatterPlot';

import { getExerciseNames, postExercise } from './exercises/network';
import { convertFromDatabaseFormat, convertToDatabaseFormat, getExercisesByNameAndConvertToDataPoint } from './utils';
import ExerciseSelect from './ExerciseSelect';
import DropdownItem from './types/DropdownItem';
import DataPoint from './types/DataPoint';
import Toast from 'react-native-toast-message'

function App(): React.JSX.Element {
  const [exercises, setExercises] = useState<DropdownItem[]>([])
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [data, setData] = useState<DataPoint[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');

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

  const handleAddExerciseOption = () => {
    setModalVisible(true);
  }

  const handleAddNewExerciseOption = () => {
    if (newExerciseName.trim().length > 0) {
      const newExerciseOption = {
        label: newExerciseName,
        value: convertToDatabaseFormat(newExerciseName),
      };
      setExercises([...exercises, newExerciseOption]);
      setSelectedItem(newExerciseOption);
      setNewExerciseName('');
      setModalVisible(false);
    } else {
      Alert.alert('Error', 'Please enter a valid exercise name');
    }
  }

  const handleAddDataPoint = async (_e: any) => {
    try {
      if (selectedItem) {
        const parsedWeight = parseFloat(weight);
        const parsedReps = parseFloat(reps);
        if (isNaN(parsedReps) || isNaN(parsedWeight)) {
          Toast.show({
            type: 'error',
            text1: 'Whoops!',
            text2: 'Reps or weights must be numbers.'
          });
        } else {
          const newExercise = {
            name: selectedItem.value,
            weight: parsedWeight,
            reps: parsedReps,
          }
          const insertedEntry = await postExercise(newExercise);
          if (insertedEntry._id) {
            setData(await getExercisesByNameAndConvertToDataPoint(insertedEntry.name));
            setReps("");
            setWeight("");
          } else {
            // TODO handle failure, alert user
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }


  return (
    <SafeAreaView style={styles.container}>
      { data && selectedItem && <ScatterPlot data={data} title={selectedItem.label} /> }
      <ExerciseSelect setModalVisible={setModalVisible} selectedItem={selectedItem} setSelectedItem={setSelectedItem} handleSelect={handleSelect} items={exercises} />
      { selectedItem && (
        <View>
          <TextInput
            placeholder="Weight"
            value={weight.toString()}
            onChangeText={(text) => setWeight(text)}
          />
          <TextInput
            placeholder="Reps"
            value={reps.toString()}
            onChangeText={(text) => setReps(text)}
          />
          <Button title="Add" onPress={handleAddDataPoint} />
        </View>
      )}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Enter new exercise name"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              style={styles.modalInput}
            />
            <Button title="Add" onPress={handleAddNewExerciseOption} />
          </View>
        </View>
      </Modal>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  selectMenu: {
    flexGrow: 1,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Dimensions.get("window").width,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10
  }
});

export default App;

