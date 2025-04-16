import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  FlatList
} from 'react-native';
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
import FloatingActionButton from '../components/FloatingActionButton';
import { useRealm } from '@realm/react';

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
            });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  const handleDataPointClick = (point: DataPoint) => {
    getExerciseById(point.label!, realm).then(m => {
      setCurrentExercisePoint(m);
      setModalKey('exerciseContent');
      setModalVisible(true);
    });
  }

  const onDropdownChange = (item: DropdownItem) => {
    if (item.value === "new_exercise") {
      setModalKey("newExercise");
      setModalVisible(true);
    } else {
      setSelectedItem(item);
      handleSelect(item);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExerciseDropdown 
        dropdownItems={dropdownItems}
        onChange={onDropdownChange} 
        selectedItem={selectedItem}
      />
      { data && selectedItem && (
        <>
          <ScatterPlot
            onDataPointClick={handleDataPointClick}
            datasets={[data]}
            zoomAndPanEnabled={false}
          />
          <FlatList
            data={[...exerciseEntries].sort((a, b) => b.createdAt - a.createdAt)}
            keyExtractor={(item) => item._id}
            style={styles.exerciseList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.exerciseItem} 
                onPress={() => getExerciseById(item._id, realm).then(m => {
                  setCurrentExercisePoint(m);
                  setModalKey('exerciseContent');
                  setModalVisible(true);
                })}
              >
                <Text style={styles.exerciseDate}>
                  {new Date(item.createdAt * 1000).toLocaleDateString()}
                </Text>
                <Text style={styles.exerciseWeight}>
                  {item.weight}lbs × {item.reps} reps
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}
      { 
        selectedItem && (
          <FloatingActionButton onPress={() => setFormModalVisible(true)} />
        )
      }
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        { modalKey && modalKey === "newExercise" ? 
          <NewExerciseModalContent
            setData={setData}
            setDropdownItems={setDropdownItems}
            dropdownItems={dropdownItems}
            setSelectedItem={setSelectedItem}
            setModalVisible={setModalVisible}
          /> :
          currentExercisePoint && (
            <ExerciseModalContent
              setModalVisible={setModalVisible}
              reloadData={reloadData}
              entry={currentExercisePoint}
            />
          )
        }
      </CustomModal>
      
      <CustomModal visible={formModalVisible} setVisible={setFormModalVisible}>
        <View>
          <KeyboardAwareForm
            inputs={exerciseLogInputs}
            onSubmit={(formData) => {
              handleAddDataPoint(formData);
              setFormModalVisible(false);
            }}
            submitButtonText="Add"
          />
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    justifyContent: 'flex-start',
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  exerciseList: {
    marginTop: 10,
    height: 200,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  exerciseDate: {
    fontSize: 16,
  },
  exerciseWeight: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
export default ExerciseLogScreen;
