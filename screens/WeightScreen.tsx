import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
import { API_BASE_URL } from '../config';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';
//import { useRealm } from '@realm/react';
import WeightEntry from '../types/WeightEntry';
import Weight from '../types/Weight';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const WeightScreen = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [weightEntries, setWeightEntries] = useState<Weight[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedWeight, setSelectedWeight] = useState<WeightEntry | null>(null);
  const [weightModalVisible, setWeightModalVisible] = useState<boolean>(false);
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

  const loadData = () => {
    getWeight()
      .then(result => {
        setData(mapWeightEntriesToDataPoint(result));
        setWeightEntries(result.map(entry => ({
          value: entry.value,
          createdAt: entry.createdAt
        })));
      })
      .catch(error => {
        console.error('Error loading weights:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not load weight data, please try again.');
        }
      });
  }

  const handleAddWeight = async (_e: any) => {
    const parsedWeight = parseFloat(weight);
    if (!isNaN(parsedWeight)) {
      try {
        await postWeight({
          value: parsedWeight,
          createdAt: Math.floor(Date.now() / 1000),
        });
        showToastInfo("Weight added.");
        loadData();
        setModalVisible(false);
        setWeight("");
      } catch (error) {
        console.error('Error adding weight:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Weight could not be added, try again.');
        }
      }
    } else {
      showToastError('Weight must be a number.')
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDataPointClick = async (point: DataPoint) => {
    console.log('Weight screen - data point clicked:', point);
    
    if (!point.label) {
      console.log('Data point has no label property');
      showToastError('Could not identify weight entry');
      return;
    }
    
    // Use requestAnimationFrame to avoid state update issues during async operations
    requestAnimationFrame(async () => {
      try {
        console.log(`Fetching weight data for ID: ${point.label}`);
        
        // Get the token first
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          showToastError('Authentication required. Please log in again.');
          return;
        }
        
        // Get weight entry from API using the ID
        const weightResponse = await fetch(`${API_BASE_URL}/weight/${point.label}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!weightResponse.ok) {
          if (weightResponse.status === 401 || weightResponse.status === 403) {
            handleAuthError(new AuthenticationError('Authentication failed'));
            return;
          }
          throw new Error(`Failed to get weight by ID: ${weightResponse.status}`);
        }
        
        const weightItem = await weightResponse.json();
        console.log('Weight item found:', weightItem);
        
        if (weightItem) {
          // Update state in proper sequence with animation frames
          setSelectedWeight(weightItem);
          
          // Use another requestAnimationFrame to separate state updates
          requestAnimationFrame(() => {
            setWeightModalVisible(true);
          });
        } else {
          console.log('No weight entry found with ID:', point.label);
          showToastError('Weight entry not found');
        }
      } catch (error) {
        console.error('Error finding weight entry:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Error loading weight details');
        }
      }
    });
  }

  const handleDeleteWeight = async () => {
    if (selectedWeight && selectedWeight._id) {
      try {
        const weightId = selectedWeight._id;
        
        try {
          await deleteWeight(weightId);
          showToastInfo("Weight deleted successfully");
          
          setSelectedWeight(null);
          setWeightModalVisible(false);
          loadData();
        } catch (deleteError) {
          console.error('Error deleting weight:', deleteError);
          
          if (deleteError instanceof AuthenticationError) {
            handleAuthError(deleteError);
          } else {
            showToastError("Could not delete weight, please try again");
          }
        }
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
        <Card style={styles.weightForm} disabled>
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
        <Card disabled style={styles.modalCard}>
          {selectedWeight ? (
            <View style={styles.modalContainer}>
              <View style={styles.modalInfoRow}>
                <Text category="h6" style={styles.dateText}>{formatTime(selectedWeight.createdAt)}</Text>
                <Text category="h6" style={styles.modalWeightValue}>{selectedWeight.value.toString()} lbs</Text>
              </View>
              <Button
                style={styles.deleteButton}
                status="danger"
                appearance="ghost"
                accessoryLeft={DeleteIcon}
                onPress={handleDeleteWeight}
              />
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
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modalCard: {
    width: 'auto',
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
    marginLeft: 12,
  },
  dateText: {
    fontWeight: 'normal',
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
  },
  weightForm: {
    width: Dimensions.get("window").width * 0.70,
  }
});

export default WeightScreen;
