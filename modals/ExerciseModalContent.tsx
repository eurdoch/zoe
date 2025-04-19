import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { formatTime, showToastError } from '../utils';
import ExerciseEntry from '../types/ExerciseEntry';
import { Icon } from '@ui-kitten/components';
import { deleteExerciseById } from '../network/exercise';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

interface Props {
  entry: ExerciseEntry;
  reloadData: (name: string) => void;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const ExerciseModalContent: React.FC<Props> = ({ entry, reloadData, setModalVisible }) => {
  const navigation = useNavigation();
  
  // Function to handle authentication errors
  const handleAuthError = async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token from AsyncStorage
    try {
      await AsyncStorage.removeItem('token');
      console.log('Token removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (storageError) {
      console.error('Error removing token from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  };

  const handleDeleteExercise = (_e: any) => {
    deleteExerciseById(entry._id)
      .then(() => {
        reloadData(entry.name);
        setModalVisible(false);
      })
      .catch(error => {
        console.error('Error deleting exercise:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not delete exercise, try again.');
        }
      });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, styles.bold]}>{formatTime(entry.createdAt)}</Text>
      <Text style={styles.text}>{entry.reps.toString() + ' @ ' + entry.weight.toString() + ' lbs'}</Text>
      <TouchableOpacity 
        onPress={() => handleDeleteExercise(entry)} 
        style={styles.deleteButton}
      > 
        <Icon
          name="trash-2-outline"
          width={24}
          height={24}
          fill="#ff6b6b"
        />
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
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    marginTop: 5,
  }
});

export default ExerciseModalContent;
