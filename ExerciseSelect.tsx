import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Button, Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DropdownItem from './types/DropdownItem';
import { useModal } from './ModalContext';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { convertToDatabaseFormat } from './utils';

interface Props {
  exercises: DropdownItem[];
  setExercises: React.Dispatch<React.SetStateAction<DropdownItem[]>>;
  handleSelect: (item: DropdownItem) => void;
  selectedItem: DropdownItem | undefined;
  setSelectedItem: React.Dispatch<React.SetStateAction<DropdownItem | undefined>>;

}

const ExerciseSelect = ({
  exercises,
  setExercises,
  handleSelect,
  selectedItem,
  setSelectedItem,
}: Props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const { showModal, hideModal } = useModal();

  const handleAddNewExerciseOption = () => {
    if (newExerciseName.trim().length > 0) {
      const newExerciseOption = {
        label: newExerciseName,
        value: convertToDatabaseFormat(newExerciseName),
      };
      setExercises([...exercises, newExerciseOption]);
      setSelectedItem(newExerciseOption);
      setNewExerciseName('');
      hideModal();
    } else {
      Toast.show({ type: 'error', text1: 'Whoops!', text2: 'Please enter a valid exercise name.'});
    }
  }

  const newExerciseModalContent = 
    <View>
      <TextInput
        placeholder="Enter new exercise name"
        value={newExerciseName}
        onChangeText={setNewExerciseName}
        style={[styles.modalInput, { width: Dimensions.get("window").width * 0.8 }]}
      />
      <Button title="Add" onPress={handleAddNewExerciseOption} />
    </View>;

  const renderLabel = (item: DropdownItem) => (
    <View style={styles.labelStyle}>
      <Text>{item.label}</Text>
    </View>
  );

  const dropdownItems = [{ value: 'new_exercise', label: 'Add New Exercise' }, ...exercises];

  return (
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
      placeholder={!isFocus ? 'Select Exercise' : '...'}
      searchPlaceholder="Search..."
      value={selectedItem ? selectedItem.value : undefined}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
      onChange={(item: DropdownItem) => {
        setIsFocus(false);
        if (item.value === "new_exercise") {
          showModal(newExerciseModalContent);
        } else {
          setSelectedItem(item);
          handleSelect(item);
        }
      }}
      renderItem={renderLabel}
    />
  );
};

const styles = StyleSheet.create({
  dropdown: {
    margin: 16,
    height: 50,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.5,
  },
  labelStyle: {
    padding: 10,
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
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});

export default ExerciseSelect;

