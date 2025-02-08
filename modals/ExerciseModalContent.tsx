import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { formatTime, showToastError } from '../utils';
import ExerciseEntry from '../types/ExerciseEntry';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { deleteExerciseById } from '../network/exercise';
import { useRealm } from '@realm/react';

interface Props {
  entry: ExerciseEntry;
  reloadData: (name: string) => void;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const ExerciseModalContent: React.FC<Props> = ({ entry, reloadData, setModalVisible }) => {
  const realm = useRealm();

  const handleDeleteExercise = (_e: any) => {
    deleteExerciseById(entry._id, realm).then(() => {
      reloadData(entry.name);
      setModalVisible(false);
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
