import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { formatTime, showToastError } from '../utils';
import ExerciseEntry from '../types/ExerciseEntry';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { deleteExerciseById } from '../network/exercise';
import { useModal } from '../modals/ModalContext';
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
      <Text style={[styles.text, styles.bold]}>{formatTime(entry.createdAt)}</Text>
      <Text style={styles.text}>{entry.reps.toString() + ' @ ' + entry.weight.toString() + ' lbs'}</Text>
      <TouchableOpacity onPress={() => handleDeleteExercise(entry)}> 
        <MaterialCommunityIcons name="delete" size={20}/>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'System',
    fontSize: 20,
  },
  bold: {
    fontWeight: 'bold',
  }
});
export default ExerciseModalContent;
