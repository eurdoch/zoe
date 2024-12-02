import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import WeightEntry from './types/WeightEntry';
import FloatingActionButton from './FloatingActionButton';
import { useModal } from './ModalContext';
import AddWeightModal from './AddWeightModal';
import { getWeight } from './network/weight';

const WeightScreen = () => {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const { showModal } = useModal();

  useEffect(() => {
    getWeight().then(result => setWeightEntries(result));
  }, []);

  const handleAddWeight = (_e: any) => {
    showModal(<AddWeightModal />);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {weightEntries.map((entry, index) => <Text key={index}>{JSON.stringify(entry)}</Text>)}
      <FloatingActionButton onPress={handleAddWeight} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default WeightScreen;
