import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DropdownItem from './types/DropdownItem';
import Exercise from './types/Exercise';

interface Props {
  items: DropdownItem[];
  handleSelect: (item: DropdownItem) => void;
  selectedItem: DropdownItem | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<DropdownItem | null>>;
}

const ExerciseSelect = ({ items, handleSelect, selectedItem, setSelectedItem }: Props) => {
  const [isFocus, setIsFocus] = useState<boolean>(false);

  const renderLabel = (item: DropdownItem) => (
    <View style={styles.labelStyle}>
      <Text>{item.label}</Text>
    </View>
  );

  return (
    <Dropdown
      style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      inputSearchStyle={styles.inputSearchStyle}
      iconStyle={styles.iconStyle}
      data={items}
      search
      maxHeight={300}
      labelField="label"
      valueField="value"
      placeholder={!isFocus ? 'Select Exercise' : '...'}
      searchPlaceholder="Search..."
      value={selectedItem ? selectedItem.value : ""}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
      onChange={(item: DropdownItem) => {
        setIsFocus(false);
        setSelectedItem(item);
        handleSelect(item);
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

