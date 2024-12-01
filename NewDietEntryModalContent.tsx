import { View, TextInput, Text } from "react-native"
import NutritionItem from './types/NutritionItem';
import { useState } from 'react';

interface NewDietEntryModalContentProps {
  item: NutritionItem;
}

const NewDietEntryModalContent = ({ item }: NewDietEntryModalContentProps) => {
  const [amount, setAmount] = useState('');

  return (
    <View>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
      />
      <Text>Serving Unit: {item.serving_unit}</Text>
      <Text>Serving Quantity: {item.serving_qty}</Text>
    </View>
  );
}

export default NewDietEntryModalContent;
