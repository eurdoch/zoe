import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, Modal, Pressable, TextInput, TouchableOpacity, Button } from 'react-native';
import { getSupplement, postSupplement } from '../network/supplement';
import SupplementEntry from '../types/SupplementEntry';
import FloatingActionButton from '../components/FloatingActionButton';
import { formatTime, showToastError, showToastInfo } from '../utils';
import CustomModal from '../CustomModal';
import { Dropdown } from 'react-native-element-dropdown';
interface SupplementScreenProps {}
interface Option {
  label: string;
  value: string;
}
const SupplementScreen: React.FC<SupplementScreenProps> = () => {
  const [supplementEntries, setSupplementEntries] = useState<SupplementEntry[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [supplementName, setSupplementName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<Option>({value: "", label: "unit"});
  const loadData = () => {
    getSupplement().then(entries => setSupplementEntries(entries));
  }
  useEffect(() => {
    loadData();
  }, []);
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
    <ScrollView contentContainerStyle={styles.container}>
      {
        supplementEntries.map(entry => <View style={styles.supplementEntry} key={entry._id}>
            <View style={styles.entryTextContainer}>
              <Text style={[styles.entryText, styles.boldText]}>{formatTime(entry.createdAt)}</Text>
              <Text style={styles.entryText}>{entry.name}</Text>
            </View>
            <Text style={styles.entryText}>{entry.amount + ' ' + entry.amount_unit }</Text>
        </View>)
      }
      <FloatingActionButton onPress={() => setModalVisible(true)} />
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        <TextInput
          value={supplementName}
          onChangeText={setSupplementName}
          placeholder="Enter supplement"
        />
        <View style={styles.amountContainer}>
          <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} />
          <Dropdown
            style={styles.dropdown}
            data={options}
            labelField="label"
            valueField="value"
            placeholder={selectedUnit.label}
            value={selectedUnit.value}
            onChange={item => setSelectedUnit(item)}
          />
        </View>
        <Button title="Add" onPress={handleAddSupplement} />
      </CustomModal>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get("window").width,
    padding: 10,
    gap: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  supplementEntry: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryTextContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  entryText: {
    fontFamily: 'Inter',
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
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
  dropdown: {
    flex: 1,
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});
export default SupplementScreen;
