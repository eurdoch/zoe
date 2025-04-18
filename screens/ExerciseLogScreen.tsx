import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
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
import Toast from 'react-native-toast-message'
import NewExerciseModalContent from '../modals/NewExerciseModalContent';
import ExerciseModalContent from '../modals/ExerciseModalContent';
import KeyboardAwareForm from '../components/KeyboardAwareForm';
import CustomModal from '../CustomModal';
import ExerciseEntry from '../types/ExerciseEntry';
import ExerciseDropdown from '../components/ExerciseDropdown';
import { useRealm } from '@realm/react';
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
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [data, setData] = useState<DataPoint[]>([]);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [currentExercisePoint, setCurrentExercisePoint] = useState<ExerciseEntry | null>(null);
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const realm = useRealm();
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

  useEffect(() => {
    getExerciseNames(realm)
      .then(names => {
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
      })
      .catch(err => {
        showToastError('Could not get exercises, please try again.');
        console.log(err);
      });
    if (route.params && route.params.name) {
      const item = {
        label: convertFromDatabaseFormat(route.params.name),
        value: route.params.name,
      };
      setSelectedItem(item);
      handleSelect(item);
    }
  }, []);

  const handleSelect = async (item: DropdownItem) => {
    const result = await getExercisesByNameAndConvertToDataPoint(item.value, realm);
    setData(result.dataPoints);
    setExerciseEntries(result.exerciseEntries);
  }

  const reloadData = async (name: string) => {
    const result = await getExercisesByNameAndConvertToDataPoint(name, realm);
    setData(result.dataPoints);
    setExerciseEntries(result.exerciseEntries);
  }

  const handleAddDataPoint = (formData: ExerciseFormData) => {
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
          postExercise(newExercise, realm)
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
  }

  const handleDataPointClick = (point: DataPoint) => {
    getExerciseById(point.label!, realm)
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
  }

  const onDropdownChange = (item: DropdownItem) => {
    console.log("Dropdown change:", item);
    
    if (item.value === "new_exercise") {
      console.log("Setting modalKey to newExercise");
      
      // Set modal key before making modal visible
      setModalKey("newExercise");
      
      // Use setTimeout to ensure state update happens first
      setTimeout(() => {
        setModalVisible(true);
      }, 100);
      
      // Return early to prevent setting this as selected item
      return;
    }
    
    // For regular exercise items
    setSelectedItem(item);
    handleSelect(item);
  }

  const renderAddButton = () => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
      onPress={() => setFormModalVisible(true)}
    />
  );

  const renderExerciseItem = ({ item }: { item: ExerciseEntry }) => (
    <ListItem
      title={() => (
        <View style={styles.listItemRow}>
          <Text category="p1" style={styles.dateText}>{new Date(item.createdAt * 1000).toLocaleDateString()}</Text>
          <Text category="s1" style={styles.weightReps}>{`${item.weight}lbs × ${item.reps} reps`}</Text>
        </View>
      )}
      onPress={() => getExerciseById(item._id, realm).then(m => {
        setCurrentExercisePoint(m);
        setModalKey('exerciseContent');
        setModalVisible(true);
      })}
    />
  );

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
              data={[...exerciseEntries].sort((a, b) => b.createdAt - a.createdAt)}
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
      
      <Modal
        visible={formModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setFormModalVisible(false)}
      >
        <Card disabled>
          <KeyboardAwareForm
            inputs={exerciseLogInputs}
            onSubmit={(formData: any) => {
              handleAddDataPoint(formData as ExerciseFormData);
              setFormModalVisible(false);
            }}
            submitButtonText="Add"
          />
        </Card>
      </Modal>
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
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }
});
export default ExerciseLogScreen;
