import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View
} from 'react-native';
import ScatterPlot from '../ScatterPlot';
import { getExerciseById, getExerciseNames, postExercise } from '../network/exercise';
import { convertFromDatabaseFormat, getExercisesByNameAndConvertToDataPoint, showToastError } from '../utils';
import DropdownItem from '../types/DropdownItem';
import DataPoint from '../types/DataPoint';
import Toast from 'react-native-toast-message'
import { useModal } from '../modals/ModalContext';
import NewExerciseModalContent from '../modals/NewExerciseModalContent';
import ExerciseModalContent from '../modals/ExerciseModalContent';
import KeyboardAwareForm from '../components/KeyboardAwareForm';
import { Dropdown } from 'react-native-element-dropdown';

interface ExerciseLogScreenProps {
  route: any;
}

interface ExerciseFormData {
  weight: string;
  reps: string;
  notes: string;
  createdAt: number;
}

function ExerciseLogScreen({ route }: ExerciseLogScreenProps): React.JSX.Element {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const [exercises, setExercises] = useState<DropdownItem[]>([])
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [data, setData] = useState<DataPoint[]>([]);
  const { showModal } = useModal();

  const dropdownItems = [
    {
      value: 'new_exercise',
      label: 'Add New Exercise'
    }, 
    ...exercises
  ];

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

  useEffect(() => {
    getExerciseNames()
      .then(names => {
        const sortedNames = names.sort((a, b) => a.localeCompare(b));
        const items = sortedNames.map(name => ({
          label: convertFromDatabaseFormat(name),
          value: name,
        }));
        setExercises(items);
        if (route.params && route.params.name) {
          const item = {
            label: convertFromDatabaseFormat(route.params.name),
            value: route.params.name,
          };
          setSelectedItem(item);
          handleSelect(item);
        }
      })
      .catch(err => {
        showToastError('Could not get exercises: ' + err.toString());
      }); 
  }, []);

  const handleSelect = async (item: DropdownItem) => {
    const dataPoints = await getExercisesByNameAndConvertToDataPoint(item.value);
    setData(dataPoints);
  }

  const reloadData = async (name: string) => {
    setData(await getExercisesByNameAndConvertToDataPoint(name)); 
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
            });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  const handleDataPointClick = (point: DataPoint) => {
    getExerciseById(point.label!).then(m => {
      showModal(<ExerciseModalContent reloadData={reloadData} entry={m} />)
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={dropdownItems}
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Select exercise' : '...'}
        searchPlaceholder="Search..."
        value={selectedItem === undefined ? '' : selectedItem.value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          if (item.value === "new_exercise") {
            showModal(
              <NewExerciseModalContent
                setData={setData}
                setExercises={setExercises}
                exercises={exercises}
                setSelectedItem={setSelectedItem}
              />
            );
          } else {
            setSelectedItem(item);
            handleSelect(item);
          }
        }}
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
          <View>
            <KeyboardAwareForm
              inputs={exerciseLogInputs}
              onSubmit={handleAddDataPoint}
              submitButtonText="Add"
            />
          </View>
        )
      }
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
  dropdown: {
      height: 50,
      borderColor: 'gray',
      borderWidth: 0.5,
      borderRadius: 8,
      paddingHorizontal: 8,
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
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  }
});
export default ExerciseLogScreen;
