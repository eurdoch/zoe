import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TextInput, 
  Button, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Pressable 
} from 'react-native';
import { getSupplement, getSupplementNames, postSupplement } from '../network/supplement';
import SupplementEntry from '../types/SupplementEntry';
import FloatingActionButton from '../components/FloatingActionButton';
import { convertFromDatabaseFormat, convertToDatabaseFormat, formatTime, showToastError, showToastInfo, getCurrentDayUnixTime } from '../utils';
import CustomModal from '../CustomModal';
import { Dropdown } from 'react-native-element-dropdown';
import DropdownItem from '../types/DropdownItem';
import { useRealm } from '@realm/react';

const options = [
    { label: "unit", value: "" },
    { label: "mg", value: "mg" },
    { label: "g", value: "g" },
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
  const [recentEntries, setRecentEntries] = useState<SupplementEntry[]>([]);
  const [recentEntriesVisible, setRecentEntriesVisible] = useState<boolean>(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  const realm = useRealm();
  
  // Remove duplicates and keep only the most recent entry for each unique combination
  const removeDuplicates = (entries: SupplementEntry[]): SupplementEntry[] => {
    const uniqueEntries: { [key: string]: SupplementEntry } = {};
    
    // Process entries, keeping only the most recent one for each unique combination
    entries.forEach(entry => {
      const key = `${entry.name}_${entry.amount}_${entry.amount_unit}`;
      
      // If this key doesn't exist yet, or if this entry is more recent than the stored one
      if (!uniqueEntries[key] || entry.createdAt > uniqueEntries[key].createdAt) {
        uniqueEntries[key] = entry;
      }
    });
    
    // Convert the object back to an array and sort by createdAt (newest first)
    return Object.values(uniqueEntries).sort((a, b) => b.createdAt - a.createdAt);
  };
  
  // Function to show the slide-up panel
  const showRecentEntries = () => {
    setRecentEntriesVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Function to hide the slide-up panel
  const hideRecentEntries = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setRecentEntriesVisible(false);
    });
  };

  const loadData = () => {
    // Get start of current day in Unix time
    const startOfDay = getCurrentDayUnixTime();
    // End of day is start of day + 24 hours (in seconds)
    const endOfDay = startOfDay + (24 * 60 * 60);
    
    getSupplement(realm, startOfDay, endOfDay)
      .then(entries => setSupplementEntries(entries))
      .catch(error => {
        console.error('Error loading supplements:', error);
        showToastError('Could not load supplements');
      });
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

  // Get today's date in MM/DD/YYYY format
  const getTodayDate = () => {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Calculate slide up transform
  const slideUpTransform = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.dateHeader}>Today: {getTodayDate()}</Text>
      </View>
      
      {supplementEntries.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No supplements taken today</Text>
        </View>
      ) : (
        supplementEntries.map(entry => (
          <View style={styles.supplementEntry} key={entry._id}>
            <View style={styles.entryTextContainer}>
              <Text style={[styles.entryText, styles.boldText]}>{formatTime(entry.createdAt)}</Text>
              <Text style={styles.entryText}>{convertFromDatabaseFormat(entry.name)}</Text>
            </View>
            <Text style={styles.entryText}>{entry.amount + ' ' + entry.amount_unit}</Text>
          </View>
        ))
      )}
      
      <FloatingActionButton onPress={() => setModalVisible(true)} />
      <FloatingActionButton 
        onPress={() => {
          // Fetch the last 10 supplement entries and show in slide-up panel
          getSupplement(realm, undefined, undefined, 20)
            .then(entries => {
              // Process entries to remove duplicates (keeping only the most recent entry)
              const uniqueEntries = removeDuplicates(entries);
              
              // Set the unique entries (limited to 10)
              setRecentEntries(uniqueEntries.slice(0, 10));
              
              // Show the panel
              showRecentEntries();
              
              // If we removed any duplicates, show a notification
              const duplicatesRemoved = entries.length - uniqueEntries.length;
              if (duplicatesRemoved > 0) {
                showToastInfo(`Removed ${duplicatesRemoved} duplicate entries`);
              }
            })
            .catch(error => {
              console.error('Error fetching recent supplements:', error);
              showToastError('Error fetching recent supplement entries');
            });
        }}
        icon="history"
        style={{ left: 20, right: undefined, backgroundColor: '#4CAF50' }}
      />
      
      {/* Recent Entries Slide-up Panel */}
      {recentEntriesVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable style={styles.closeOverlayArea} onPress={hideRecentEntries} />
          <Animated.View style={[styles.slideUpPanel, slideUpTransform]}>
            <View style={styles.slideUpHeader}>
              <Text style={styles.slideUpTitle}>Recent Supplements</Text>
              <TouchableOpacity onPress={hideRecentEntries}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.recentEntriesList}>
              {recentEntries.map(entry => (
                <TouchableOpacity 
                  key={entry._id} 
                  style={styles.recentEntryItem}
                  onPress={() => {
                    console.log('Entry details:', JSON.stringify(entry, null, 2));
                    showToastInfo(`${convertFromDatabaseFormat(entry.name)} ${entry.amount}${entry.amount_unit}`);
                  }}
                >
                  <View style={styles.recentEntryContent}>
                    <Text style={styles.recentEntryTime}>{formatTime(entry.createdAt)}</Text>
                    <Text style={styles.recentEntryName}>
                      {convertFromDatabaseFormat(entry.name)}
                    </Text>
                    <Text style={styles.recentEntryAmount}>{entry.amount} {entry.amount_unit}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}
      
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
        {/* <Button 
          title="Nutrition Label Parser" 
          onPress={() => {
            setModalVisible(false);
            navigation.navigate('NutritionLabelParser')
          }} 
        /> */}

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
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 5,
  },
  dateHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#888',
    fontFamily: 'Inter',
  },
  boldText: {
    fontWeight: 'bold',
  },
  supplementEntry: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  // Slide-up panel styles
  slideUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  closeOverlayArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 300, // Same height as the panel
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  slideUpPanel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  slideUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  slideUpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  closeButton: {
    fontSize: 22,
    color: '#555',
  },
  recentEntriesList: {
    flex: 1,
  },
  recentEntryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentEntryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentEntryTime: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  recentEntryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    marginLeft: 10,
  },
  recentEntryAmount: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#555',
  },
});

export default SupplementScreen;

