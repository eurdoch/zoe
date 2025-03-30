import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Button, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import FloatingActionButton from '../components/FloatingActionButton';
import { getWeight, postWeight, deleteWeight } from '../network/weight';
import { mapWeightEntriesToDataPoint, showToastError, showToastInfo, formatTime } from '../utils';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';
import CustomModal from '../CustomModal';
import { useRealm } from '@realm/react';
import WeightEntry from '../types/WeightEntry';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const WeightScreen = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedWeight, setSelectedWeight] = useState<WeightEntry | null>(null);
  const [weightModalVisible, setWeightModalVisible] = useState<boolean>(false);
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

  const handleDataPointClick = (point: DataPoint) => {
    console.log('handleDataPointClick: ', point);
    if (point.label) {
      const weightItem = realm.objectForPrimaryKey<WeightEntry>('WeightEntry', point.label);
      console.log('weightItem found:', weightItem);
      if (weightItem) {
        setSelectedWeight(weightItem);
        setWeightModalVisible(true);
      } else {
        console.log('No weight entry found with ID:', point.label);
      }
    } else {
      console.log('Data point has no label property');
    }
  }

  const handleDeleteWeight = () => {
    if (selectedWeight && selectedWeight._id) {
      try {
        const weightId = selectedWeight._id;
        
        deleteWeight(weightId, realm).then(() => {
          showToastInfo("Weight deleted successfully");
          
          setSelectedWeight(null);
          setWeightModalVisible(false);
          loadData();
        });
      } catch (error) {
        showToastError("Could not delete weight, please try again");
        console.error(error);
      }
    }
  }

  return (
    <View style={styles.container}>
      <ScatterPlot
        datasets={[data]}
        onDataPointClick={handleDataPointClick}
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

      <CustomModal visible={weightModalVisible} setVisible={setWeightModalVisible}>
        {selectedWeight ? (
          <View style={styles.modalContainer}>
            <Text style={[styles.text, styles.bold]}>{formatTime(selectedWeight.createdAt)}</Text>
            <Text style={styles.text}>{selectedWeight.value.toString()} lbs</Text>
            <TouchableOpacity onPress={handleDeleteWeight}> 
              <MaterialCommunityIcons name="delete" size={20}/>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.modalContainer}>
            <Text style={styles.text}>No weight data available</Text>
          </View>
        )}
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
  modalContainer: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  text: {
    fontFamily: 'System',
    fontSize: 20,
  },
  bold: {
    fontWeight: 'bold',
  }
});

export default WeightScreen;
