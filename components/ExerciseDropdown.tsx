import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Select, SelectItem, IndexPath } from '@ui-kitten/components';
import DropdownItem from '../types/DropdownItem';

interface ExerciseDropdownProps {
  onChange: (item: DropdownItem) => void;
  selectedItem: DropdownItem | undefined;
  dropdownItems: DropdownItem[];
}

const ExerciseDropdown = ({ onChange, selectedItem, dropdownItems }: ExerciseDropdownProps) => {
  const displayValue = selectedItem ? selectedItem.label : 'Select exercise';
  
  const renderOption = (item: DropdownItem) => (
    <SelectItem key={item.value} title={item.label} />
  );
  
  const onSelectChange = (index: IndexPath | IndexPath[]) => {
    if (Array.isArray(index)) {
      return; // We're not using multi-select
    }
    
    console.log("Selected index:", index.row);
    console.log("Dropdown items:", dropdownItems);
    
    // Make sure the index is valid before accessing the array
    if (index.row >= 0 && index.row < dropdownItems.length) {
      const selected = dropdownItems[index.row];
      console.log("Selected item:", selected);
      
      // Use requestAnimationFrame to defer the state update to the next frame
      // to avoid updating state during render
      requestAnimationFrame(() => {
        onChange(selected);
      });
    } else {
      console.warn(`Invalid index: ${index.row}, dropdown items length: ${dropdownItems.length}`);
    }
  };
  
  // Find the index of the selected item
  const selectedIndex = selectedItem 
    ? dropdownItems.findIndex(item => item.value === selectedItem.value)
    : -1;
    
  return (
    <Select
      style={styles.select}
      placeholder="Select exercise"
      value={displayValue}
      selectedIndex={selectedIndex >= 0 ? new IndexPath(selectedIndex) : undefined}
      onSelect={onSelectChange}
    >
      {dropdownItems.map(renderOption)}
    </Select>
  );
};

export default ExerciseDropdown;

const styles = StyleSheet.create({
  select: {
    marginBottom: 16,
  },
});
