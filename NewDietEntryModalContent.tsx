import { View, TextInput, Text, Button } from "react-native"
import NutritionItem from './types/NutritionItem';
import { useState } from 'react';
import { getFood, postFood } from "./network/food";
import Food from "./types/Food";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useModal } from "./ModalContext";

interface NewDietEntryModalContentProps {
  item: NutritionItem;
}

const NewDietEntryModalContent = ({ item }: NewDietEntryModalContentProps) => {
  const [amount, setAmount] = useState('');
  const { hideModal } = useModal();

  const handleAddDietEntry = async (_e: any) => {
    hideModal();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      Toast.show({
        type: 'error',
        text1: 'Whoops!',
        text2: 'Amount must be a number.'
      });
      return;
    }

    try {
      const now = new Date();
      const newFoodEntry: Food = {
        serving_amount: parsedAmount,
        food_name: item.food_name,
        brand_name: item.brand_name,
        serving_qty: item.serving_qty,
        serving_unit: item.serving_unit,
        nix_item_id: item.nix_item_id,
        createdAt: now.toISOString(),
      }
      const result = await postFood(newFoodEntry);
      if (result.acknowledged) {
        Toast.show({
          type: 'info',
          text1: 'Nice!',
          text2: 'Food added.'
        })
        const insertedEntry = await getFood(result.insertedId);
        // TODO add to local state displaying day's items
      }
    } catch (error) {
      console.error('Error adding diet entry:', error);
      Toast.show({
        type: 'error',
        text1: 'Whoops!',
        text2: 'An error occurred while adding the diet entry.'
      });
    }
  }

  return (
    <View>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
      />
      <Text>Serving Unit: {item.serving_unit}</Text>
      <Text>Serving Quantity: {item.serving_qty}</Text>
      <Button onPress={handleAddDietEntry} title="Add Diet Entry" />
    </View>
  );
}

export default NewDietEntryModalContent;
