import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable,
  ScrollView
} from 'react-native';
import { 
  Layout, 
  Text, 
  Input, 
  Button, 
  Modal, 
  Card,
  Select,
  SelectItem,
  Icon,
  List,
  ListItem,
  Divider
} from '@ui-kitten/components';
import { getSupplement, getSupplementNames, postSupplement } from '../network/supplement';
import SupplementEntry from '../types/SupplementEntry';
import { convertFromDatabaseFormat, convertToDatabaseFormat, formatTime, showToastError, showToastInfo, getCurrentDayUnixTime } from '../utils';
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

  const renderAddButton = () => (
    <Button
      style={styles.floatingButton}
      status="primary"
      accessoryLeft={(props) => <Icon {...props} name="plus-outline" />}
      onPress={() => setModalVisible(true)}
    />
  );
  
  const renderHistoryButton = () => (
    <Button
      style={styles.historyButton}
      status="success"
      accessoryLeft={(props) => <Icon {...props} name="clock-outline" />}
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
    />
  );
  
  const renderItem = ({ item }: { item: SupplementEntry }) => (
    <ListItem
      title={() => (
        <View style={styles.entryTextContainer}>
          <Text category="s1" style={styles.boldText}>{formatTime(item.createdAt)}</Text>
          <Text category="p1">{convertFromDatabaseFormat(item.name)}</Text>
        </View>
      )}
      accessoryRight={() => <Text category="p2">{item.amount + ' ' + item.amount_unit}</Text>}
    />
  );

  const renderRecentItem = (entry: SupplementEntry) => (
    <ListItem
      key={entry._id}
      title={() => (
        <View>
          <Text category="s2">{convertFromDatabaseFormat(entry.name)}</Text>
          <Text category="c1">{formatTime(entry.createdAt)}</Text>
        </View>
      )}
      accessoryRight={() => <Text>{entry.amount} {entry.amount_unit}</Text>}
      onPress={() => {
        // Add a new supplement entry with the same details but current timestamp
        postSupplement({
          name: entry.name,
          amount: entry.amount,
          createdAt: Math.floor(Date.now() / 1000),
          amount_unit: entry.amount_unit,
        }, realm)
          .then(() => {
            showToastInfo(`Added ${convertFromDatabaseFormat(entry.name)}`);
            loadData();
            hideRecentEntries();
          })
          .catch(error => {
            console.error('Error adding supplement from history:', error);
            showToastError('Could not add supplement, try again.');
          });
      }}
    />
  );

  return (
    <Layout style={styles.container}>
      {supplementEntries.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text category="h6" appearance="hint">No supplements taken today</Text>
        </View>
      ) : (
        <Card style={styles.card}>
          <Text category="h6" style={styles.listTitle}>Today's Supplements</Text>
          <Divider />
          <List
            data={supplementEntries}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
          />
        </Card>
      )}
      
      {renderAddButton()}
      {renderHistoryButton()}
      
      {/* Recent Entries Slide-up Panel */}
      {recentEntriesVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable style={styles.closeOverlayArea} onPress={hideRecentEntries} />
          <Animated.View style={[styles.slideUpPanel, slideUpTransform]}>
            <Card disabled>
              <View style={styles.slideUpHeader}>
                <Text category="h6">Recent Supplements</Text>
                <Button
                  appearance="ghost"
                  size="small"
                  accessoryLeft={(props) => <Icon {...props} name="close-outline" />}
                  onPress={hideRecentEntries}
                />
              </View>
              <Divider />
              <ScrollView style={styles.recentEntriesList}>
                {recentEntries.map(entry => renderRecentItem(entry))}
              </ScrollView>
            </Card>
          </Animated.View>
        </View>
      )}
      
      <Modal
        visible={modalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={() => setModalVisible(false)}
      >
        <Card disabled>
          {selectedItem?.value === 'new_supplement' ? (
            <Input
              style={styles.input}
              placeholder="Enter new supplement name"
              value={newSupplementName}
              onChangeText={setNewSupplementName}
            />
          ) : (
            <Select
              style={styles.select}
              placeholder="Select supplement"
              value={selectedItem ? selectedItem.label : ''}
              onSelect={(index) => {
                const item = dropdownItems[index as number];
                setSelectedItem(item);
                setNewSupplementName("");
              }}
            >
              {dropdownItems.map(item => (
                <SelectItem key={item.value} title={item.label} />
              ))}
            </Select>
          )}
          
          <View style={styles.amountContainer}>
            <Input
              style={styles.amountInput}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
            />
            <Select
              style={styles.unitSelect}
              placeholder={selectedUnit.label}
              value={selectedUnit.label}
              onSelect={(index) => setSelectedUnit(options[index as number])}
            >
              {options.map(option => (
                <SelectItem key={option.value} title={option.label} />
              ))}
            </Select>
          </View>
          
          <Button onPress={handleAddSupplement}>ADD</Button>
        </Card>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  boldText: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  entryTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  unitSelect: {
    width: 120,
  },
  input: {
    marginBottom: 8,
  },
  select: {
    marginBottom: 8,
  },
  listTitle: {
    marginBottom: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    borderRadius: 28,
    width: 56,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  historyButton: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    borderRadius: 28,
    width: 56,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
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
    height: 300,
  },
  slideUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentEntriesList: {
    flex: 1,
    marginTop: 8,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default SupplementScreen;

