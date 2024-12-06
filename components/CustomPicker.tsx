import React from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface CustomPickerProps<T> {
  selectedValue: T;
  onValueChange: (itemValue: T) => void;
  items: Array<{
    label: string;
    value: T;
  }>;
  height?: number;
  enabled?: boolean;
}

function CustomPicker<T extends string | number>({
  selectedValue,
  onValueChange,
  items,
  height = 200, // default height
  enabled = true,
}: CustomPickerProps<T>) {
  return (
    <View style={styles.pickerContainer}>
      <Picker<T>
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        enabled={enabled}
        style={[
          styles.picker,
          Platform.OS === 'android' && { height: height }
        ]}
        itemStyle={Platform.OS === 'ios' ? { height: height / 4 } : undefined}
      >
        {items.map((item) => (
          <Picker.Item
            key={item.value.toString()}
            label={item.label}
            value={item.value}
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});

export default CustomPicker;
