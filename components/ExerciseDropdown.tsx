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
    
    const selected = dropdownItems[index.row];
    onChange(selected);
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
