import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Button } from 'react-native';
import FloatingActionButton from '../components/FloatingActionButton';
import { getWeight, postWeight } from '../network/weight';
import { mapWeightEntriesToDataPoint, showToastError, showToastInfo } from '../utils';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';
import CustomModal from '../CustomModal';
import { useRealm } from '@realm/react';

const WeightScreen = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const realm = useRealm();

  const loadData = () => {
    getWeight(realm).then(result => {
      setData(mapWeightEntriesToDataPoint(result));
    });
  }

  const handleAddWeight = async (_e: any) => {
    const parsedWeight = parseFloat(weight);
    if (!isNaN(parsedWeight)) {
      try {
        await postWeight({
          value: parsedWeight,
          createdAt: Math.floor(Date.now() / 1000),
        }, realm);
        showToastInfo("Weight added.");
        loadData();
        setModalVisible(false);
        setWeight("");
      } catch {
        showToastError('Weight could not be added, try again.');
      }
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
          keyboardType="numeric"
          style={styles.input}
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
  },
});

export default WeightScreen;
