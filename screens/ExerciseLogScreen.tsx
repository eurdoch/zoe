import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Animated,
  Pressable,
} from 'react-native';
import { 
  Layout, 
  Card, 
  Text, 
  Button,
  Divider,
  List,
  ListItem,
  Modal,
  Icon,
} from '@ui-kitten/components';
import ScatterPlot from '../ScatterPlot';
import { getExerciseById, getExerciseNames, postExercise } from '../network/exercise';
import { convertFromDatabaseFormat, getExercisesByNameAndConvertToDataPoint, showToastError } from '../utils';
import DropdownItem from '../types/DropdownItem';
import DataPoint from '../types/DataPoint';
import Toast from 'react-native-toast-message';
import { API_BASE_URL } from '../config';
import NewExerciseModalContent from '../modals/NewExerciseModalContent';
import ExerciseModalContent from '../modals/ExerciseModalContent';
import KeyboardAwareForm from '../components/KeyboardAwareForm';
import ExerciseEntry from '../types/ExerciseEntry';
import ExerciseDropdown from '../components/ExerciseDropdown';
import { useNavigation } from '@react-navigation/native';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExerciseLogScreenProps {
  route: any;
}

interface ExerciseFormData {
  weight: string;
  reps: string;
  notes: string;
  createdAt: number;
}

const exerciseLogInputs = [
  {
    name: 'weight',
    placeholder: 'Weight',
    keyboardType: 'numeric' as const,
    defaultValue: '',
  },
  {
    name: 'reps', 
    placeholder: 'Reps',
    keyboardType: 'numeric' as const,
    defaultValue: '',
  },
  {
    name: 'notes',
    placeholder: 'Notes',
    defaultValue: '',
  },
  {
    name: 'createdAt',
    isDate: true,
  },
];

function ExerciseLogScreen({ route }: ExerciseLogScreenProps): React.JSX.Element {
  // State hooks - always declare these first and unconditionally
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [data, setData] = useState<DataPoint[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [currentExercisePoint, setCurrentExercisePoint] = useState<ExerciseEntry | null>(null);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [formModalAnim] = useState(new Animated.Value(0));
  
  // Context hooks
  const navigation = useNavigation();

  // Callback hooks - declare all of these before any useEffect
  const handleAuthError = React.useCallback(async (error: AuthenticationError) => {
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
  }, [navigation]);

  // This function is now used only for reference and could be removed if no other 
  // parts of the component use it directly.
  // We're keeping it for now but making it a no-op to avoid any potential circular references.
  const handleSelect = React.useCallback(async (_item: DropdownItem) => {
    // No-op - Logic moved to onDropdownChange and the useEffect for initialization
    console.log('handleSelect is deprecated and should not be called directly');
  }, []);

  const reloadData = React.useCallback(async (name: string) => {
    try {
      const result = await getExercisesByNameAndConvertToDataPoint(name);
      setData(result.dataPoints);
      setExerciseEntries(result.exerciseEntries);
    } catch (error) {
      console.error('Error reloading data:', error);
      if (error instanceof AuthenticationError) {
        handleAuthError(error);
      } else {
        showToastError('Could not refresh exercise data.');
      }
    }
  }, [handleAuthError]);

  const handleDataPointClick = React.useCallback((point: DataPoint) => {
    getExerciseById(point.label!)
      .then(m => {
        setCurrentExercisePoint(m);
        setModalKey('exerciseContent');
        setModalVisible(true);
      })
      .catch(error => {
        console.error('Error fetching exercise:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not fetch exercise details.');
        }
      });
  }, [handleAuthError]);

  const handleAddDataPoint = React.useCallback((formData: ExerciseFormData) => {
    try {
      if (selectedItem) {
        const parsedWeight = parseFloat(formData.weight);
        const parsedReps = parseInt(formData.reps);
        if (isNaN(parsedReps) || isNaN(parsedWeight)) {
          Toast.show({
            type: 'error',
            text1: 'Whoops!',
            text2: 'Reps or weights must be numbers.'
          });
        } else {
          const newExercise = {
            name: selectedItem.value,
            weight: parsedWeight,
            reps: parsedReps,
            createdAt: formData.createdAt,
            notes: formData.notes,
          }
          postExercise(newExercise)
            .then(insertedEntry => {
              if (insertedEntry._id) {
                reloadData(insertedEntry.name);
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Whoops!',
                  text2: 'Entry could not be added, please try again.'
                });
              }
            })
            .catch(error => {
              console.error('Error posting exercise:', error);
              
              if (error instanceof AuthenticationError) {
                handleAuthError(error);
              } else {
                showToastError('Entry could not be added, please try again.');
              }
            });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }, [selectedItem, reloadData, handleAuthError]);

  const onDropdownChange = React.useCallback((item: DropdownItem) => {
    console.log("Dropdown change:", item);
    
    if (item.value === "new_exercise") {
      console.log("Setting modalKey to newExercise");
      
      // Set modal key before making modal visible
      setModalKey("newExercise");
      
      // Use requestAnimationFrame to avoid state updates during render
      requestAnimationFrame(() => {
        setModalVisible(true);
      });
      
      // Return early to prevent setting this as selected item
      return;
    }
    
    // For regular exercise items
    setSelectedItem(item);
    
    // Instead of calling handleSelect which might be causing recursive calls,
    // we'll directly fetch the data
    getExercisesByNameAndConvertToDataPoint(item.value)
      .then(result => {
        setData(result.dataPoints);
        setExerciseEntries(result.exerciseEntries);
      })
      .catch(error => {
        console.error('Error selecting exercise:', error);
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          showToastError('Could not load exercise data.');
        }
      });
  }, [setModalKey, setModalVisible, setSelectedItem, handleAuthError]);
  
  const showFormModal = React.useCallback(() => {
    setFormModalVisible(true);
    // Use requestAnimationFrame to avoid state updates during render
    requestAnimationFrame(() => {
      Animated.timing(formModalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [formModalAnim]);
  
  const hideFormModal = React.useCallback(() => {
    // Use requestAnimationFrame to avoid state updates during render
    requestAnimationFrame(() => {
      Animated.timing(formModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setFormModalVisible(false);
      });
    });
  }, [formModalAnim]);

  // Effect hooks
  useEffect(() => {
    const loadExerciseNames = async () => {
      try {
        const names = await getExerciseNames();
        
        if (route.params?.name && !names.includes(route.params.name)) {
          names.push(route.params.name);
        }
        
        const sortedItems = names
          .sort((a, b) => a.localeCompare(b)).map(name => ({
            label: convertFromDatabaseFormat(name),
            value: name,
          }));
          
        setDropdownItems([
          {
            value: 'new_exercise',
            label: 'Add New Exercise'
          }, 
          ...sortedItems
        ]);
        
        // Only set the selected item and load data after dropdown items are set
        if (route.params && route.params.name) {
          const item = {
            label: convertFromDatabaseFormat(route.params.name),
            value: route.params.name,
          };
          setSelectedItem(item);
          
          // Directly call getExercisesByNameAndConvertToDataPoint instead of handleSelect
          // to avoid potential circular dependencies
          const result = await getExercisesByNameAndConvertToDataPoint(item.value);
          setData(result.dataPoints);
          setExerciseEntries(result.exerciseEntries);
        }
      } catch (err) {
        showToastError('Could not get exercises, please try again.');
        console.log(err);
      }
    };
    
    loadExerciseNames();
  }, [route.params]);

  // Calculate slide up transform for form modal
  const formModalTransform = React.useMemo(() => ({
    transform: [
      {
        translateY: formModalAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0], // Use a large enough value to ensure it's off-screen
        }),
      },
    ],
  }), [formModalAnim]);

  const renderAddButton = React.useCallback(() => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
      onPress={showFormModal}
    />
  ), [showFormModal]);

  const renderExerciseItem = React.useCallback(({ item }: { item: ExerciseEntry }) => (
    <ListItem
      title={() => (
        <View style={styles.listItemRow}>
          <Text category="p1" style={styles.dateText}>{new Date(item.createdAt * 1000).toLocaleDateString()}</Text>
          <Text category="s1" style={styles.weightReps}>{`${item.weight}lbs × ${item.reps} reps`}</Text>
        </View>
      )}
      onPress={() => {
        getExerciseById(item._id)
          .then(m => {
            setCurrentExercisePoint(m);
            setModalKey('exerciseContent');
            setModalVisible(true);
          })
          .catch(error => {
            if (error instanceof AuthenticationError) {
              handleAuthError(error);
            } else {
              showToastError('Could not fetch exercise details.');
            }
          });
      }}
    />
  ), [handleAuthError]);

  return (
    <Layout style={styles.container}>
      <View style={styles.dropdownContainer}>
        <ExerciseDropdown 
          dropdownItems={dropdownItems}
          onChange={onDropdownChange} 
          selectedItem={selectedItem}
        />
      </View>
      
      {data && selectedItem && (
        <>
          <Card style={styles.card}>
            <ScatterPlot
              onDataPointClick={handleDataPointClick}
              datasets={[data]}
              zoomAndPanEnabled={false}
            />
          </Card>
          
          <Card style={styles.listCard}>
            <Text category="h6" style={styles.listTitle}>Exercise History</Text>
            <Divider />
            <List
              data={[...exerciseEntries].sort((a, b) => {
                // Convert timestamps to Date objects and get date strings
                const dateA = new Date(a.createdAt * 1000).toDateString();
                const dateB = new Date(b.createdAt * 1000).toDateString();
                
                // If dates are different, sort by date (newest first)
                if (dateA !== dateB) {
                  return b.createdAt - a.createdAt;
                }
                
                // If same date (same day), sort by weight (heaviest first)
                return b.weight - a.weight;
              })}
              keyExtractor={(item) => item._id}
              renderItem={renderExerciseItem}
            />
          </Card>
        </>
      )}
      
      {selectedItem && renderAddButton()}
      
      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => {
          console.log("Modal backdrop pressed");
          setModalVisible(false);
        }}
      >
        <Card disabled>
          {modalKey === "newExercise" ? (
            <>
              {console.log("Rendering NewExerciseModalContent")}
              <NewExerciseModalContent
                setData={setData}
                setDropdownItems={setDropdownItems}
                dropdownItems={dropdownItems}
                setSelectedItem={setSelectedItem}
                setModalVisible={setModalVisible}
              />
            </>
          ) : currentExercisePoint ? (
            <>
              {console.log("Rendering ExerciseModalContent")}
              <ExerciseModalContent
                setModalVisible={setModalVisible}
                reloadData={reloadData}
                entry={currentExercisePoint}
              />
            </>
          ) : (
            <Text>No content to display</Text>
          )}
        </Card>
      </Modal>
      
      {/* Add Exercise Form Slide-up Panel */}
      {formModalVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable 
            style={[styles.closeOverlayArea]} 
            onPress={hideFormModal} 
          />
          <Animated.View 
            style={[
              styles.slideUpPanel,
              formModalTransform,
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
                <Text category="h6">Add Exercise Entry</Text>
              </View>
              <Divider />
              <KeyboardAwareForm
                inputs={exerciseLogInputs}
                onSubmit={(formData: any) => {
                  handleAddDataPoint(formData as ExerciseFormData);
                  hideFormModal();
                }}
                submitButtonText="Add"
              />
            </View>
          </Animated.View>
        </View>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  addNewButton: {
    marginTop: 8,
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
  listItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 16,
  },
  weightReps: {
    fontWeight: 'bold',
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
    minHeight: 350, // Minimum height
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
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  exerciseSetForm: {
    width: Dimensions.get('window').width * 0.9,
  }
});
export default ExerciseLogScreen;
