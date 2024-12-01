import { View, Text } from "react-native"
import NutritionItem from './types/NutritionItem';

interface NewDietEntryModalContentProps {
  item: NutritionItem;
}

const NewDietEntryModalContent = ({ item }: NewDietEntryModalContentProps) => {
  return (
    <View>
      <Text>{JSON.stringify(item)}</Text>
    </View>
  );
}

export default NewDietEntryModalContent;
