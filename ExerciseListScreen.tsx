import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity, Button, Text } from 'react-native';
import ExerciseEntry from './types/ExerciseEntry';
import { deleteExerciseById, getExerciseById, getExerciseDataByName, getExerciseNames } from './exercises/network';
import ScatterPlot from './ScatterPlot';
import DataPoint from './types/DataPoint';
import { convertFromDatabaseFormat, extractUnixTimeFromISOString, formatTime, mapEntriesToDataPoint } from './utils';

const ExerciseListScreen = () => {
  const [exerciseDataArray, setExerciseDataArray] = useState<DataPoint[][] | null>(null);
  const [names, setNames] = useState<string[] | null>(null);
  const [modalExerciseEntry, setModalExerciseEntry] = useState<ExerciseEntry | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const fetchData = async () => {
    const names = await getExerciseNames();
    setNames(names.map(convertFromDatabaseFormat));
    const dataArray: ExerciseEntry[][] = [];
    for (const name of names) {
      const data = await getExerciseDataByName(name);
      dataArray.push(data);
    }
    const dataPointArray = dataArray.map(mapEntriesToDataPoint);
    setExerciseDataArray(dataPointArray);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleDataPointClick = (point: DataPoint) => {
    getExerciseById(point.label!).then(m => {
      setModalExerciseEntry(m);
      setModalVisible(true);
    });
  }

  const handleDeleteExercise = (_e: any) => {
    if (modalExerciseEntry) {
      deleteExerciseById(modalExerciseEntry._id).then(() => {
        fetchData();
        setModalVisible(false);
      });
    }
  }

  return (
    <View style={styles.container}>
    <ScrollView>
        { exerciseDataArray && names &&
          exerciseDataArray.map((data, i) =>
            <View key={i}>
              <ScatterPlot
                onDataPointClick={handleDataPointClick}
                data={data}
                title={names[i]}
              />
            </View>
          )
        }
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {modalExerciseEntry && (
              <>
                <Text>Weight: {modalExerciseEntry.weight.toString()} lbs</Text>
                <Text>Reps: {modalExerciseEntry.reps.toString()}</Text>
                <Text>Date: {formatTime(extractUnixTimeFromISOString(modalExerciseEntry.createdAt))}</Text>
                <Button title="Delete" onPress={handleDeleteExercise} />
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemContainer: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
  },
});

export default ExerciseListScreen;
