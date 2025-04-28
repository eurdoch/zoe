import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Pressable } from 'react-native';
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
import LinearGradient from 'react-native-linear-gradient';
import FloatingActionButton from '../components/FloatingActionButton';
import { getWeight, postWeight, deleteWeight } from '../network/weight';
import { mapWeightEntriesToDataPoint, showToastError, showToastInfo, formatTime, formatTimeWithYear } from '../utils';
import { API_BASE_URL } from '../config';
import ScatterPlot from '../ScatterPlot';
import DataPoint from '../types/DataPoint';
import WeightEntry from '../types/WeightEntry';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const WeightScreen = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalAnim] = useState(new Animated.Value(0));
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
        // Use the WeightEntry objects directly
        setWeightEntries(result);
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

  const showModal = () => {
    setModalVisible(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const hideModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

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

  const handleItemPress = (item: WeightEntry) => {
    // Set the selected weight entry to display in modal
    setSelectedWeight(item);
    // Show the modal
    setWeightModalVisible(true);
  };

  const renderItem = ({ item }: { item: WeightEntry }) => (
    <ListItem
      onPress={() => handleItemPress(item)}
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
  
  // Calculate slide up transform for add weight modal
  const modalTransform = {
    transform: [
      {
        translateY: modalAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0], // Start from off-screen
        }),
      },
    ],
  };

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
      
      <FloatingActionButton
        style={styles.floatingButton}
        icon="plus-outline"
        onPress={showModal}
      />
      
      {/* Add Weight Slide-up Panel */}
      {modalVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable 
            style={styles.closeOverlayArea} 
            onPress={hideModal} 
          />
          <Animated.View 
            style={[
              styles.slideUpPanel,
              modalTransform,
              { 
                backgroundColor: 'white', 
                borderTopLeftRadius: 15, 
                borderTopRightRadius: 15,
                zIndex: 1001 // Higher than the overlay
              }
            ]}
          >
            <View>
              <View style={styles.slideUpHeader}>
                <Text category="h6">Add Weight</Text>
              </View>
              <Divider />
              <View style={styles.formContainer}>
                <Input
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Enter weight"
                  keyboardType="numeric"
                  style={styles.input}
                  size="large"
                  textStyle={styles.inputText}
                />
                <LinearGradient
                  colors={['#444444', '#222222']}
                  style={styles.gradientContainer}
                >
                  <Button 
                    style={styles.addButton}
                    onPress={handleAddWeight}
                    appearance="filled"
                    size="large"
                  >
                    <Text style={styles.buttonText}>Add</Text>
                  </Button>
                </LinearGradient>
              </View>
            </View>
          </Animated.View>
        </View>
      )}

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
    marginBottom: 8,
    width: '100%',
    borderRadius: 15,
  },
  inputText: {
    fontSize: 18,
    height: 20,
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
  },
  // Slide-up panel styles
  slideUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  closeOverlayArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // Cover full screen
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  slideUpPanel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  slideUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formContainer: {
    padding: 16,
  },
  gradientContainer: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  addButton: {
    marginTop: 0,
    height: 50,
    borderRadius: 15,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  }
});

export default WeightScreen;
