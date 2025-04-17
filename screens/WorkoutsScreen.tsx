import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { 
  Layout, 
  Button, 
  Text, 
  Card, 
  List, 
  Icon 
} from '@ui-kitten/components';
import WorkoutEntry from '../types/WorkoutEntry';
import { getWorkouts } from '../network/workout';
import { useFocusEffect } from '@react-navigation/native';
import { useRealm } from '@realm/react';

interface WorkoutsScreenProps {
  navigation: any;
}

const WorkoutsScreen = ({ navigation }: WorkoutsScreenProps) => {
  const realm = useRealm();
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);

  // For navigation to and back to
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = getWorkouts(realm).then(ws => setWorkoutEntries(ws));
      return () => unsubscribe;
    }, [])
  );

  const handleStartWorkout = (entry: WorkoutEntry) => {
    navigation.navigate('Workout', { workout: entry })
  }

  const renderAddButton = () => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props: any) => <Icon {...props} name="plus-outline" />}
      onPress={() => navigation.navigate('CreateWorkout')}
    />
  );

  const renderItem = ({ item }: { item: WorkoutEntry }) => (
    <Card style={styles.card} key={item._id}>
      <Button
        appearance="filled"
        status="primary"
        onPress={() => handleStartWorkout(item)}
      >
        {item.name}
      </Button>
    </Card>
  );

  return (
    <Layout style={styles.container}>
      <List
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
        data={workoutEntries}
        renderItem={renderItem}
      />
      {renderAddButton()}
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
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  card: {
    marginVertical: 8,
    width: '80%',
    alignSelf: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
  },
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
    width: 56,
    height: 56,
  },
});

export default WorkoutsScreen;
