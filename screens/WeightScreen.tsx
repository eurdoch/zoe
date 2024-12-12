import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Button } from 'react-native';
import FloatingActionButton from '../components/FloatingActionButton';
import { getWeight, postWeight } from '../network/weight';
import { mapWeightEntriesToDataPoint, showToastError, showToastInfo } from '../utils';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';
import CustomModal from '../CustomModal';

const WeightScreen = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const loadData = () => {
    getWeight().then(result => {
      setData(mapWeightEntriesToDataPoint(result));
    });
  }

  const handleAddWeight = async (_e: any) => {
    const parsedWeight = parseFloat(weight);
    if (!isNaN(parsedWeight)) {
      const result = await postWeight({
        value: parsedWeight,
        createdAt: Math.floor(Date.now() / 1000),
      });
      if (result.acknowledged) {
        showToastInfo('Weight added.');
        loadData();
      } else {
        showToastError('Weight could not be added, try again.');
      }
      setModalVisible(false);
      setWeight("");
    } else {
      showToastError('Weight must be a number.')
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <ScatterPlot
        datasets={[data]}
        onDataPointClick={() => {}}
        zoomAndPanEnabled={false}
      />
      <FloatingActionButton onPress={() => setModalVisible(true)} />
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Enter weight"
        />
        <Button title="Add" onPress={handleAddWeight} />
      </CustomModal>
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
