import React, { useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import ExerciseEntry from './types/ExerciseEntry';
import { deleteExerciseById, getExerciseById } from './network/exercise';
import ScatterPlot from './ScatterPlot';
import DataPoint from './types/DataPoint';
import { extractUnixTimeFromISOString, formatTime } from './utils';
import { useModal } from './ModalContext';

type ExerciseInfoScreenProps = {
  route: any;
}

const ExerciseInfoScreen = ({ route }: ExerciseInfoScreenProps) => {
  const [modalExerciseEntry, setModalExerciseEntry] = useState<ExerciseEntry | null>(null);
  const { showModal, hideModal } = useModal();

  const handleDeleteExercise = (_e: any) => {
    if (modalExerciseEntry) {
      deleteExerciseById(modalExerciseEntry._id).then(() => {
        // TODO reload data
        hideModal();
      });
    }
  }

  //TODO refactor to separate component
  const modalContent = 
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

  const handleDataPointClick = (point: DataPoint) => {
    getExerciseById(point.label!).then(m => {
      setModalExerciseEntry(m);
    }).then(() => {
      showModal(modalContent);
    });
  }

  return (
    <View style={styles.container}>
      <ScatterPlot
        data={route.params.data}
        title={route.params.title}
        onDataPointClick={handleDataPointClick}
      />
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

export default ExerciseInfoScreen;
