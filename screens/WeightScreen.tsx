import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Layout, 
  Text, 
  Button, 
  Card, 
  List, 
  ListItem, 
  Modal, 
  Input,
  Icon,
  Divider 
} from '@ui-kitten/components';
import { getWeight, postWeight, deleteWeight } from '../network/weight';
import { mapWeightEntriesToDataPoint, showToastError, showToastInfo, formatTime, formatTimeWithYear } from '../utils';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';
import { useRealm } from '@realm/react';
import WeightEntry from '../types/WeightEntry';
import Weight from '../types/Weight';

const WeightScreen = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [weightEntries, setWeightEntries] = useState<Weight[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedWeight, setSelectedWeight] = useState<WeightEntry | null>(null);
  const [weightModalVisible, setWeightModalVisible] = useState<boolean>(false);
  const realm = useRealm();

  const loadData = () => {
    getWeight(realm).then(result => {
      setData(mapWeightEntriesToDataPoint(result));
      setWeightEntries(result.map(entry => ({
        value: entry.value,
        createdAt: entry.createdAt
      })));
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

  const renderItem = ({ item }: { item: Weight }) => (
    <ListItem
      title={() => (
        <View style={styles.weightItem}>
          <Text category="p1">{formatTimeWithYear(item.createdAt)}</Text>
          <Text category="s1" style={styles.weightValue}>{item.value.toFixed(1)} lbs</Text>
        </View>
      )}
    />
  );
  
  const DeleteIcon = (props: any) => (
    <Icon {...props} name="trash-2-outline" />
  );

  const AddIcon = (props: any) => (
    <Icon {...props} name="plus-outline" />
  );

  return (
    <Layout style={styles.container}>
      <Card style={styles.card}>
        <ScatterPlot
          datasets={[data]}
          onDataPointClick={handleDataPointClick}
          zoomAndPanEnabled={false}
        />
      </Card>
      
      <Card style={styles.listCard}>
        <Text category="h6" style={styles.listTitle}>Weight History</Text>
        <Divider />
        <List
          data={weightEntries.sort((a, b) => b.createdAt - a.createdAt)}
          renderItem={renderItem}
          keyExtractor={(item) => item.createdAt.toString()}
        />
      </Card>
      
      <Button
        style={styles.floatingButton}
        status="primary"
        accessoryLeft={AddIcon}
        onPress={() => setModalVisible(true)}
      />
      
      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setModalVisible(false)}
      >
        <Card disabled>
          <Input
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight"
            keyboardType="numeric"
            style={styles.input}
          />
          <Button status="primary" onPress={handleAddWeight}>
            ADD
          </Button>
        </Card>
      </Modal>

      <Modal
        visible={weightModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setWeightModalVisible(false)}
      >
        <Card disabled>
          {selectedWeight ? (
            <View style={styles.modalContainer}>
              <Text category="h6">{formatTime(selectedWeight.createdAt)}</Text>
              <Text category="s1" style={styles.modalWeightValue}>{selectedWeight.value.toString()} lbs</Text>
              <Button
                status="danger"
                appearance="ghost"
                accessoryLeft={DeleteIcon}
                onPress={handleDeleteWeight}
              >
                DELETE
              </Button>
            </View>
          ) : (
            <View style={styles.modalContainer}>
              <Text category="s1">No weight data available</Text>
            </View>
          )}
        </Card>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginVertical: 8,
  },
  listCard: {
    marginVertical: 8,
    flex: 1,
  },
  listTitle: {
    marginBottom: 8,
  },
  modalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  weightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  weightValue: {
    fontWeight: 'bold',
  },
  modalWeightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  floatingButton: {
    position: 'absolute',
    right: 32,
    bottom: 32,
    borderRadius: 28,
    width: 60,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }
});

export default WeightScreen;
