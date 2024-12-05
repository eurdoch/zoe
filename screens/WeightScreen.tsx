import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WeightEntry from '../types/WeightEntry';
import FloatingActionButton from '../components/FloatingActionButton';
import { useModal } from '../components/ModalContext';
import AddWeightModal from '../modals/AddWeightModal';
import { getWeight } from '../network/weight';
import { mapWeigthEntriesToDataPoint } from '../utils';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';

const WeightScreen = () => {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [data, setData] = useState<DataPoint[]>([]);
  const { showModal } = useModal();

  const loadData = () => {
    getWeight().then(result => {
      setWeightEntries(result);
      setData(mapWeigthEntriesToDataPoint(result));
    });
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWeight = (_e: any) => {
    showModal(<AddWeightModal loadData={loadData} />);
  }

  return (
    <View style={styles.container}>
      <ScatterPlot
        data={data}
        onDataPointClick={() => {}}
        zoomAndPanEnabled={false}
      />
      <FloatingActionButton onPress={handleAddWeight} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default WeightScreen;
