import { useState } from "react";
import { Button, Dimensions, StyleSheet, TextInput, View } from "react-native";
import { convertToDatabaseFormat } from "./utils";
import { useModal } from "./ModalContext";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import DropdownItem from "./types/DropdownItem";
import DataPoint from "./types/DataPoint";

interface NewExerciseModalContentProps {
  exercises: DropdownItem[];
  setExercises: React.Dispatch<React.SetStateAction<DropdownItem[]>>;
  setSelectedItem: React.Dispatch<React.SetStateAction<DropdownItem | undefined>>;
  setData: React.Dispatch<React.SetStateAction<DataPoint[] | undefined>>;
}

const NewExerciseModalContent = ({ exercises, setExercises, setSelectedItem, setData }: NewExerciseModalContentProps) => {
  const [value, setValue] = useState<string>('');
  const { hideModal } = useModal();

  const handleAddNewExerciseOption = () => {
    if (value.trim().length > 0) {
      const newExerciseOption = {
        label: value,
        value: convertToDatabaseFormat(value),
      };
      setExercises([...exercises, newExerciseOption]);
      setSelectedItem(newExerciseOption);
      setValue('');
      setData([]);
      hideModal();
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
        style={[styles.modalInput, { width: Dimensions.get("window").width * 0.8 }]}
      />
      <Button title="Add" onPress={handleAddNewExerciseOption} />
    </View>
  );
}

export default NewExerciseModalContent;

const styles = StyleSheet.create({
  modalInput: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});
