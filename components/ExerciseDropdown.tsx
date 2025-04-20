import React, { useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Select, SelectItem, IndexPath } from '@ui-kitten/components';
import DropdownItem from '../types/DropdownItem';

interface ExerciseDropdownProps {
  onChange: (item: DropdownItem) => void;
  selectedItem: DropdownItem | undefined;
  dropdownItems: DropdownItem[];
}

const ExerciseDropdown = ({ onChange, selectedItem, dropdownItems }: ExerciseDropdownProps) => {
  // Memoize the display value to avoid recalculating during renders
  const displayValue = useMemo(() => 
    selectedItem ? selectedItem.label : 'Select exercise',
    [selectedItem]
  );
  
  // Memoize the render function for items to prevent recreation on each render
  const renderOption = useCallback((item: DropdownItem) => (
    <SelectItem key={item.value} title={item.label} />
  ), []);
  
  const onSelectChange = useCallback((index: IndexPath | IndexPath[]) => {
    // We need to handle the selection asynchronously to avoid state updates
    // during render cycles, which can cause the "Cannot update during existing
    // state transition" error.
    if (Array.isArray(index)) {
      return; // We're not using multi-select
    }
    
    // Make sure the index is valid before trying to use it
    if (index.row >= 0 && index.row < dropdownItems.length) {
      const selected = dropdownItems[index.row];
      
      // Use setTimeout to move this state change to the next event loop
      // This ensures it doesn't happen during a render cycle
      setTimeout(() => {
        onChange(selected);
      }, 0);
    }
  }, [dropdownItems, onChange]);
  
  // Memoize the selected index calculation to avoid unnecessary recalculation
  const selectedIndexObj = useMemo(() => {
    const index = selectedItem 
      ? dropdownItems.findIndex(item => item.value === selectedItem.value)
      : -1;
      
    return index >= 0 ? new IndexPath(index) : undefined;
  }, [selectedItem, dropdownItems]);
  
  return (
    <Select
      style={styles.select}
      placeholder="Select exercise"
      value={displayValue}
      selectedIndex={selectedIndexObj}
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
