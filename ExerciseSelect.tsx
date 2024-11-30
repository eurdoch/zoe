


































































import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Button, Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DropdownItem from './types/DropdownItem';
import { useModal } from './ModalContext';
import NewExerciseModalContent from './NewExerciseModalContent';

interface Props {
  exercises: DropdownItem[];
  setExercises: React.Dispatch<React.SetStateAction<DropdownItem[]>>;
  setSelectedItem: React.Dispatch<React.SetStateAction<DropdownItem | undefined>>;
  handleSelect: (item: DropdownItem) => void;
  selectedItem: DropdownItem | undefined;
}

const ExerciseSelect = ({
  exercises,
  setExercises,
  handleSelect,
  selectedItem,
  setSelectedItem,
}: Props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const { showModal } = useModal();

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
          showModal(<NewExerciseModalContent setExercises={setExercises} exercises={exercises} setSelectedItem={setSelectedItem} />);
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
});

export default ExerciseSelect;
