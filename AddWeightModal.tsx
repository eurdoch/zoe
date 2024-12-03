import React, { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { postWeight } from "./network/weight";
import { showToastError, showToastInfo } from "./utils";
import { useModal } from "./ModalContext";
interface AddWeightModalProps {
  loadData: () => void;
}
const AddWeightModal = ({ loadData }: AddWeightModalProps) => {
  const [weight, setWeight] = useState<string>("");
  const { hideModal } = useModal()
  const handleAddWeight = async (_e: any) => {
    const parsedWeight = parseFloat(weight);
    if (!isNaN(parsedWeight)) {
      const result = await postWeight({
        value: parsedWeight,
        createdAt: Date.now(),
      });
      console.log(result);
      if (result.acknowledged) {
        showToastInfo('Weight added.');
        hideModal();
        loadData();
      } else {
        showToastError('Weight could not be added, try again.');
      }
    } else {
      showToastError('Weight must be a number.')
    }
  }
  return (
    <View>
      <TextInput
        value={weight}
        onChangeText={setWeight}
        placeholder="Enter weight"
      />
      <Button title="Add" onPress={handleAddWeight} />
    </View>
  );
}
export default AddWeightModal;
