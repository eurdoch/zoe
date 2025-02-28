import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, TextInput, Button } from 'react-native';
import { getSupplement, getSupplementNames, postSupplement } from '../network/supplement';
import SupplementEntry from '../types/SupplementEntry';
import FloatingActionButton from '../components/FloatingActionButton';
import { convertFromDatabaseFormat, convertToDatabaseFormat, formatTime, showToastError, showToastInfo } from '../utils';
import CustomModal from '../CustomModal';
import { Dropdown } from 'react-native-element-dropdown';
import DropdownItem from '../types/DropdownItem';
import { useRealm } from '@realm/react';

const options = [
    { label: "unit", value: "" },
    { label: "mg", value: "mg" },
    { label: "tablet", value: "tablet" },
    { label: "capsule", value: "capsule" },
    { label: "ml", value: "ml" },
    { label: "UI", value: "UI" }
  ]

const longestOptionLabel = options.reduce(
  (longest, option) =>
    option.label.length > longest.length
      ? option.label
      : longest,
  ""
);

interface SupplementScreenProps {
  navigation: any;
}

interface Option {
  label: string;
  value: string;
}

const SupplementScreen: React.FC<SupplementScreenProps> = ({ navigation}: SupplementScreenProps) => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const [supplementEntries, setSupplementEntries] = useState<SupplementEntry[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<Option>({value: "", label: "unit"});
  const [newSupplementName, setNewSupplementName] = useState<string>("");
  const realm = useRealm();

  const loadData = () => {
    getSupplement(realm).then(entries => setSupplementEntries(entries));
  }

  useEffect(() => {
    if (!modalVisible) {
      setSelectedItem(undefined);
      setAmount("");
    }
  }, [modalVisible]);

  useEffect(() => {
    loadData();
    getSupplementNames(realm)
      .then(names => {
        const sortedNames = names.sort((a, b) => a.localeCompare(b));
        const items = sortedNames.map(name => ({
          label: convertFromDatabaseFormat(name),
          value: name,
        }));
        setDropdownItems([
          {
            value: 'new_supplement',
            label: 'Add New Supplement'
          }, 
          ...items
        ]);
      })
      .catch(err => {
        showToastError('Could not get supplements: ' + err.toString());
      });
  }, [realm]);

  const handleAddSupplement = async (_e: any) => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount)) {
      const supplementName = selectedItem?.value === 'new_supplement' ? convertToDatabaseFormat(newSupplementName) : selectedItem?.value;
      if (supplementName) {
        try {
          await postSupplement({
            name: supplementName,
            amount: parsedAmount,
            createdAt: Math.floor(Date.now() / 1000),
            amount_unit: selectedUnit.value,
          }, realm);
          showToastInfo('Supplement added.');
          loadData();
          setModalVisible(false);
          setAmount("");
        } catch (error) {
          console.error('Error adding supplement:', error);
          showToastError('Supplement could not be added, try again.');
        }
      } else {
        showToastError('Please select or enter a supplement name.');
      }
    } else {
      showToastError('Supplement amount must be a number.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {
        supplementEntries.map(entry => <View style={styles.supplementEntry} key={entry._id}>
            <View style={styles.entryTextContainer}>
              <Text style={[styles.entryText, styles.boldText]}>{formatTime(entry.createdAt)}</Text>
              <Text style={styles.entryText}>{convertFromDatabaseFormat(entry.name)}</Text>
            </View>
            <Text style={styles.entryText}>{entry.amount + ' ' + entry.amount_unit }</Text>
        </View>)
      }
      <FloatingActionButton onPress={() => setModalVisible(true)} />
      <CustomModal visible={modalVisible} setVisible={setModalVisible}>
        {selectedItem?.value === 'new_supplement' ? (
          <TextInput
            style={styles.newSupplementInput}
            placeholder="Enter new supplement name"
            value={newSupplementName}
            onChangeText={setNewSupplementName}
          />
        ) : (
          <Dropdown
            style={[styles.dropdown, isFocus && { borderColor: 'blue', minWidth: '100%' }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={dropdownItems}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            searchPlaceholder="Search..."
            placeholder={!isFocus ? 'Select supplement' : '...'}
            value={selectedItem === undefined ? '' : selectedItem.value}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              setSelectedItem(item);
              setNewSupplementName("");
            }}
          />
        )}
        <View style={styles.amountContainer}>
          <TextInput style={styles.amountInput} placeholder="Amount" value={amount} onChangeText={setAmount} />
          <Dropdown
            style={[styles.dropdown, { width: longestOptionLabel.length * 10 + 20 }]}
            data={options}
            labelField="label"
            valueField="value"
            placeholder={selectedUnit.label}
            value={selectedUnit.value}
            onChange={item => setSelectedUnit(item)}
          />
        </View>
        <Button title="Add" onPress={handleAddSupplement} />
        <Button 
          title="Nutrition Label Parser" 
          onPress={() => {
            setModalVisible(false);
            navigation.navigate('NutritionLabelParser')
          }} 
        />
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
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  newSupplementInput: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 50,
  },
});

export default SupplementScreen;

