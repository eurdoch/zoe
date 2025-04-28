import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Input, Button, Text } from "@ui-kitten/components";
import { convertToDatabaseFormat } from "../utils";
import Toast from "react-native-toast-message";
import DropdownItem from "../types/DropdownItem";
import DataPoint from "../types/DataPoint";
import LinearGradient from 'react-native-linear-gradient';

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
    <View style={styles.container}>
      <Input
        placeholder="Enter new exercise name"
        value={value}
        onChangeText={(text) => setValue(text)}
        style={styles.input}
        size="large"
        textStyle={styles.inputText}
      />
      <LinearGradient
        colors={['#444444', '#222222']}
        style={styles.gradientContainer}
      >
        <Button 
          style={styles.addButton}
          onPress={handleAddNewExerciseOption}
          appearance="filled"
          size="large"
        >
          <Text style={styles.buttonText}>ADD</Text>
        </Button>
      </LinearGradient>
    </View>
  );
}

export default NewExerciseModalContent;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    height: 'auto',
  },
  input: {
    marginBottom: 8,
    width: '100%',
    borderRadius: 15,
  },
  inputText: {
    fontSize: 18,
    height: 20,
  },
  gradientContainer: {
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 15,
    overflow: 'hidden',
  },
  addButton: {
    marginTop: 0,
    height: 50,
    borderRadius: 15,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  }
});

