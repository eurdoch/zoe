import { useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";
import { convertToDatabaseFormat } from "../utils";
import Toast from "react-native-toast-message";
import DropdownItem from "../types/DropdownItem";
import DataPoint from "../types/DataPoint";

interface NewExerciseModalContentProps {
  dropdownItems: DropdownItem[];
  setDropdownItems: React.Dispatch<React.SetStateAction<DropdownItem[]>>;
  setSelectedItem: React.Dispatch<React.SetStateAction<DropdownItem | undefined>>;
  setData: React.Dispatch<React.SetStateAction<DataPoint[]>>;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewExerciseModalContent = ({
  dropdownItems,
  setDropdownItems,
  setSelectedItem,
  setData,
  setModalVisible
}: NewExerciseModalContentProps) => {

  const [value, setValue] = useState<string>('');

  const handleAddNewExerciseOption = () => {
    if (value.trim().length > 0) {
      const newExerciseOption = {
        label: value,
        value: convertToDatabaseFormat(value),
      };
      setDropdownItems([...dropdownItems, newExerciseOption]);
      setSelectedItem(newExerciseOption);
      setValue('');
      setData([]);
      setModalVisible(false);
    } else {
      Toast.show({ type: 'error', text1: 'Whoops!', text2: 'Please enter a valid exercise name.'});
    }
  }

  return (
    <View>
      <TextInput
        placeholder="Enter new exercise name"
        value={value}
        onChangeText={(text) => setValue(text)}
        style={styles.input}
      />
      <Button
        title="Add"
        onPress={handleAddNewExerciseOption}
        color="#007AFF"
      />
    </View>
  );
}

export default NewExerciseModalContent;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});

