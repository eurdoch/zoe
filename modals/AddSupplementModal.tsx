import React, { useState } from "react";
import { ScrollView, Text, View, TextInput, Button, StyleSheet, TouchableOpacity } from "react-native";
import { postSupplement } from "../network/supplement";
import { showToastError, showToastInfo } from "../utils";
import { useModal } from "./ModalContext";

interface AddSupplementModalProps {
  loadData: () => void;
}

interface Option {
  label: string;
  value: string;
}

const AddSupplementModal = ({ loadData }: AddSupplementModalProps) => {
  const [supplementName, setSupplementName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const { hideModal } = useModal()
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Option>({value: "", label: "unit"});

  const selectOption = (option: Option) => {
    setSelectedUnit(option);
    setIsOpen(false);
  };

  const handleAddSupplement = async (_e: any) => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount)) {
      const result = await postSupplement({
        name: supplementName,
        amount: parsedAmount,
        createdAt: Math.floor(Date.now() / 1000),
        amount_unit: selectedUnit.value,
      });
      if (result.acknowledged) {
        showToastInfo('Supplement added.');
        hideModal();
        loadData();
      } else {
        showToastError('Supplement could not be added, try again.');
      }
    } else {
      showToastError('Supplement must be a number.')
    }
  }

  const options = [
    { label: "unit", value: "" },
    { label: "mg", value: "mg" },
    { label: "tablet", value: "tablet" },
    { label: "capsule", value: "capsule" },
    { label: "ml", value: "ml" },
    { label: "UI", value: "UI" }
  ]

  return (
    <View>
      <TextInput
        value={supplementName}
        onChangeText={setSupplementName}
        placeholder="Enter supplement"
      />
      <View style={styles.amountContainer}>
        <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} />
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.selectedOption}
            onPress={() => setIsOpen(!isOpen)}
          >
            <Text>
              { selectedUnit ? selectedUnit.label : 'unit'}
            </Text>
          </TouchableOpacity>
          
          {isOpen && (
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.option}
                  onPress={() => selectOption(option)}
                >
                  <Text>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
      <Button title="Add" onPress={handleAddSupplement} />
    </View>
  );
}

export default AddSupplementModal;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 200,
  },
  selectedOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  optionsList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden', // This helps contain the picker within the border
    marginVertical: 10,
  },
  picker: {
    height: 50, // Fixed height makes it more controllable
    width: '100%',
  },
  amountContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
});
