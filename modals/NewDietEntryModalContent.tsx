import { View } from "react-native"
import { useState } from 'react';
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { useModal } from "../components/ModalContext";
import MacroCalculator from "../components/MacroCalculator";

interface NewDietEntryModalContentProps {
  item: any;
  setLogActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewDietEntryModalContent = ({ item, setLogActive }: NewDietEntryModalContentProps) => {
  console.log('item, ', item);
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
      //const result = await postFood(newFoodEntry);
      if (result.acknowledged) {
        Toast.show({
          type: 'info',
          text1: 'Nice!',
          text2: 'Food added.'
        })
        setLogActive(false);
        //const insertedEntry: FoodEntry = await getFood(result.insertedId);
        // TODO shoudln't need to update as is handled by useEffect in dietLog ?
      } else {
        Toast.show({
          type: 'error',
          text1: 'Whoops!',
          text2: 'Network error, please try again.',
        })
        setLogActive(false);
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
      <MacroCalculator productResponse={item} />
    </View>
  );
}

export default NewDietEntryModalContent;
