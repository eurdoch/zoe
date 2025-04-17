import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Layout, 
  Button, 
  Text, 
  Card, 
  List, 
  ListItem, 
  Modal, 
  Icon,
  TopNavigationAction,
  Input,
  Divider
} from '@ui-kitten/components';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkout, updateWorkout, deleteWorkout } from '../network/workout';
import { convertFromDatabaseFormat, convertToDatabaseFormat, showToastError, showToastInfo } from '../utils';
import ExerciseDropdown from '../components/ExerciseDropdown';
import DropdownItem from '../types/DropdownItem';
import { getExerciseNames } from '../network/exercise';
import { useRealm } from '@realm/react';

interface WorkoutScreenProps {
  navigation: any;
  route: any;
}

const WorkoutScreen = ({ navigation, route }: WorkoutScreenProps) => {
  const [workoutEntry, setWorkoutEntry] = useState<WorkoutEntry | null>(null);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const realm = useRealm();

  const handleDeleteWorkout = () => {
    deleteWorkout(route.params.workout._id, realm).then(() => navigation.goBack());
  }

  const DeleteIcon = (props: any) => (
    <Icon {...props} name='trash-2-outline'/>
  );
  
  const EditIcon = (props: any) => (
    <Icon {...props} name='edit-outline'/>
  );
  
  const CloseIcon = (props: any) => (
    <Icon {...props} name='close-outline'/>
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.rightHeader}>
          {isEditMode && (
            <TopNavigationAction
              icon={DeleteIcon}
              onPress={handleDeleteWorkout}
            />
          )}
          <TopNavigationAction
            icon={isEditMode ? CloseIcon : EditIcon}
            onPress={() => setIsEditMode(prev => !prev)}
          />
        </View>
      )
    })
  }, [navigation, isEditMode]);

  const handleDeleteExercise = (index: number) => {
    if (workoutEntry) {
      const newExercises = [...workoutEntry.exercises];
      newExercises.splice(index, 1);
      const newWorkoutEntry = { ...workoutEntry, exercises: newExercises };
      updateWorkout(newWorkoutEntry, realm).then(updatedWorkout => {
        setWorkoutEntry(updatedWorkout);
        showToastInfo('Exercise removed.');
      }).catch(console.log);
    }
  }

  useEffect(() => {
    getWorkout(route.params.workout._id, realm).then(w => setWorkoutEntry(w));
    getExerciseNames(realm)
      .then(names => {
        const sortedNames = names
          .sort((a, b) => a.localeCompare(b)).map(name => ({
            label: convertFromDatabaseFormat(name),
            value: name,
          }));
        setDropdownItems([
          {
            value: 'new_exercise',
            label: 'Add New Exercise'
          }, 
          ...sortedNames
        ]);
      })
      .catch(err => {
        showToastError('Could not get exercises, please try again.');
        console.log(err);
      });
  }, []);

  const handleLogExercise = (exerciseName: string) => {
    navigation.navigate('ExerciseLog', { name: exerciseName })
  }

  const handleAddToWorkout = (_e: any) => {
    if (selectedItem && workoutEntry) {
      const newWorkoutEntry = {
        _id: workoutEntry._id,
        name: workoutEntry.name,
        exercises: [
          ...workoutEntry.exercises, 
          selectedItem.value === 'new_exercise' ? 
            convertToDatabaseFormat(newExerciseName) : selectedItem.value
        ],
        createdAt: Math.floor(Date.now() / 1000)
      };
      try {
        updateWorkout(newWorkoutEntry, realm).then(result => {
          setWorkoutEntry(newWorkoutEntry);
        });
      } catch (_e: any) {
        showToastError('Exercise could not be added, try again.');
      }
    }
    setIsEditMode(false);
    setSelectedItem(undefined);
    setNewExerciseName('');
    setModalVisible(false);
  }

  const handleDropdownChange = (item: DropdownItem) => {
    if (item.value === 'new_exercise') {
      setSelectedItem({
        value: 'new_exercise',
        label: 'Add New Exercise',
      });
    } else {
      setSelectedItem(item);
      setNewExerciseName('');
    }
  }

  const renderItemAccessory = (index: number) => {
    if (isEditMode) {
      return (
        <Button
          size="small"
          status="danger"
          appearance="ghost"
          accessoryLeft={(props: any) => <Icon {...props} name="trash-2-outline" />}
          onPress={() => handleDeleteExercise(index)}
        />
      );
    }
    return <></>;
  };

  const renderAddButton = () => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props: any) => <Icon {...props} name="plus-outline" />}
      onPress={() => setModalVisible(true)}
    />
  );

  const renderItem = ({ item, index }: { item: string, index: number }) => (
    <ListItem
      title={convertFromDatabaseFormat(item)}
      onPress={!isEditMode ? () => handleLogExercise(item) : undefined}
      accessoryRight={() => renderItemAccessory(index)}
    />
  );

  return (
    <Layout style={styles.container}>
      <List
        style={styles.list}
        data={workoutEntry?.exercises || []}
        renderItem={renderItem}
        ItemSeparatorComponent={Divider}
      />
      
      {isEditMode && renderAddButton()}
      
      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setModalVisible(false)}
      >
        <Card disabled>
          {selectedItem && selectedItem.value === 'new_exercise' ? (
            <Input
              style={styles.input}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Enter new exercise name"
            />
          ) : (
            <ExerciseDropdown 
              onChange={handleDropdownChange} 
              dropdownItems={dropdownItems} 
              selectedItem={selectedItem} 
            />
          )}
          <Button 
            style={styles.addButton}
            onPress={handleAddToWorkout}
          >
            ADD EXERCISE
          </Button>
        </Card>
      </Modal>
    </Layout>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  rightHeader: {
    flexDirection: 'row',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
    width: 56,
    height: 56,
  },
  addButton: {
    marginTop: 16,
  }
});
export default WorkoutScreen;

