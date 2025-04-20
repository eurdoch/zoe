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
    if (Array.isArray(index)) {
      return;
    }
    
    if (index.row >= 0 && index.row < dropdownItems.length) {
      const selected = dropdownItems[index.row];
      
      // Use requestAnimationFrame instead of setTimeout for more consistent handling
      requestAnimationFrame(() => {
        onChange(selected);
      });
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
