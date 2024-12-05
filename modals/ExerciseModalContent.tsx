import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { formatTime, showToastError } from '../utils';
import ExerciseEntry from '../types/ExerciseEntry';
import { deleteExerciseById } from '../network/exercise';
import { useModal } from '../components/ModalContext';

interface Props {
  entry: ExerciseEntry;
  reloadData: (name: string) => void;
}

const ExerciseModalContent: React.FC<Props> = ({ entry, reloadData }) => {
  const { hideModal } = useModal();

  const handleDeleteExercise = (_e: any) => {
    deleteExerciseById(entry._id).then(() => {
      reloadData(entry.name);
      hideModal();
    }).catch(err => {
      showToastError('Could not delete exercise, try again.');
    });
  }

  return (
    <View style={styles.container}>
      <Text>Weight: {entry.weight.toString()} lbs</Text>
      <Text>Reps: {entry.reps.toString()}</Text>
      <Text>Date: {formatTime(entry.createdAt)}</Text>
      <Button onPress={handleDeleteExercise}>Delete</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default ExerciseModalContent;
