import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Input, Button, Text } from "@ui-kitten/components";
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

  const handleCancel = () => {
    setValue('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text category="h6" style={styles.title}>Add New Exercise</Text>
      <Input
        placeholder="Enter new exercise name"
        value={value}
        onChangeText={(text) => setValue(text)}
        style={styles.input}
        autoFocus
      />
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleCancel}
          appearance="outline"
          status="basic"
          style={styles.cancelButton}
        >
          CANCEL
        </Button>
        <Button
          onPress={handleAddNewExerciseOption}
          status="primary"
          style={styles.addButton}
        >
          ADD
        </Button>
      </View>
    </View>
  );
}

export default NewExerciseModalContent;

const styles = StyleSheet.create({
  container: {
    width: 280,
    padding: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flex: 1,
    marginLeft: 8,
  },
});

