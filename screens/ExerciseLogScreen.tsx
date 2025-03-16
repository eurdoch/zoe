import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text
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
    const dataPoints = await getExercisesByNameAndConvertToDataPoint(item.value, realm);
    setData(dataPoints);
  }

  const reloadData = async (name: string) => {
    setData(await getExercisesByNameAndConvertToDataPoint(name, realm)); 
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
        <ScatterPlot
          onDataPointClick={handleDataPointClick}
          datasets={[data]}
          zoomAndPanEnabled={false}
        />
      )}
      { 
        selectedItem && (
          <View style={styles.addButtonContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setFormModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
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
  addButtonContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
export default ExerciseLogScreen;
