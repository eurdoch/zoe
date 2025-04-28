import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable,
  ScrollView,
  TouchableOpacity
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
import LinearGradient from 'react-native-linear-gradient';
import { getSupplement, getSupplementNames, postSupplement } from '../network/supplement';
import SupplementEntry from '../types/SupplementEntry';
import { convertFromDatabaseFormat, convertToDatabaseFormat, formatTime, showToastError, showToastInfo, getCurrentDayUnixTime } from '../utils';
import DropdownItem from '../types/DropdownItem';
import { AuthenticationError } from '../errors/NetworkError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Supplement from '../types/Supplement';

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

const SupplementScreen: React.FC<SupplementScreenProps> = ({ navigation: propNavigation }: SupplementScreenProps) => {
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(undefined);
  const [supplementEntries, setSupplementEntries] = useState<SupplementEntry[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<Option>({value: "", label: "unit"});
  const [newSupplementName, setNewSupplementName] = useState<string>("");
  const [recentEntries, setRecentEntries] = useState<SupplementEntry[]>([]);
  
  // Animation state for Recent Entries panel
  const [recentEntriesVisible, setRecentEntriesVisible] = useState<boolean>(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  
  // Animation state for Add Supplement panel
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const addSupplementAnim = useState(new Animated.Value(0))[0];
  
  // Animation state for the fab menu
  const [isFabMenuOpen, setIsFabMenuOpen] = useState<boolean>(false);
  const fabMenuAnimation = useState(new Animated.Value(0))[0];
  const navigation = useNavigation();
  
  // Function to handle authentication errors
  const handleAuthError = async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token from AsyncStorage
    try {
      await AsyncStorage.removeItem('token');
      console.log('Token removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (storageError) {
      console.error('Error removing token from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  };
  
  
  // Function to show the recent entries slide-up panel
  const showRecentEntries = () => {
    setRecentEntriesVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Function to hide the recent entries slide-up panel
  const hideRecentEntries = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setRecentEntriesVisible(false);
    });
  };
  
  // Function to show the add supplement slide-up panel
  const showAddSupplementModal = () => {
    setModalVisible(true);
    Animated.timing(addSupplementAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Function to hide the add supplement slide-up panel
  const hideAddSupplementModal = () => {
    Animated.timing(addSupplementAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const toggleFabMenu = () => {
    const toValue = isFabMenuOpen ? 0 : 1;
    Animated.spring(fabMenuAnimation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setIsFabMenuOpen(!isFabMenuOpen);
  };
  
  const loadData = () => {
    // Get start of current day in Unix time
    const startOfDay = getCurrentDayUnixTime();
    // End of day is start of day + 24 hours (in seconds)
    const endOfDay = startOfDay + (24 * 60 * 60);
    
    // Return the promise so we can chain it
    return getSupplement(startOfDay, endOfDay)
      .then(entries => {
        setSupplementEntries(entries);
        return entries; // Return entries to allow further chaining
      })
      .catch(error => {
        console.error('Error loading supplements:', error);
        showToastError('Could not load supplements');
        throw error; // Re-throw the error to allow proper error handling
      });
  }

  useEffect(() => {
    if (modalVisible === false) {
      // Reset form fields when modal is fully hidden
      setTimeout(() => {
        setSelectedItem(undefined);
        setAmount("");
      }, 300); // Match the animation duration
    }
  }, [modalVisible]);

  useEffect(() => {
    // First load the data
    loadData()
      .then(() => {
        // Then load the dropdown items
        return getSupplementNames();
      })
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
  }, []);

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
          });
          showToastInfo('Supplement added.');
          await loadData(); // Wait for data to be loaded
          hideAddSupplementModal();
          setAmount("");
        } catch (error) {
          console.error('Error adding supplement:', error);
          
          if (error instanceof AuthenticationError) {
            handleAuthError(error);
          } else {
            showToastError('Supplement could not be added, try again.');
          }
        }
      } else {
        showToastError('Please select or enter a supplement name.');
      }
    } else {
      showToastError('Supplement amount must be a number.');
    }
  }

  // Calculate slide up transform for recent entries panel
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

  // Calculate slide up transform for add supplement panel
  const addSupplementTransform = {
    transform: [
      {
        translateY: addSupplementAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [500, 0], // Use a large enough value to ensure it's off-screen
        }),
      },
    ],
  };

  const fetchSupplementHistory = () => {
    console.log("👉 Fetching supplement history...");
    // Fetch most recent supplement entries
    getSupplement(undefined, undefined, 100)
      .then(entries => {
        console.log(`👉 Got ${entries.length} supplement entries from database`);
        console.log("👉 First few entries:", entries.slice(0, 3));
        
        // Process entries to remove duplicates (keeping only the most recent entry for each supplement name)
        const supplementNameMap: { [name: string]: SupplementEntry } = {};
        
        // Group by name and keep only the most recent entry for each supplement
        entries.forEach(entry => {
          console.log(`👉 Processing entry: ${entry._id}, name: ${entry.name}, amount: ${entry.amount}${entry.amount_unit}, time: ${new Date(entry.createdAt * 1000).toLocaleString()}`);
          const name = entry.name;
          if (!supplementNameMap[name] || entry.createdAt > supplementNameMap[name].createdAt) {
            supplementNameMap[name] = entry;
          }
        });
        
        console.log(`👉 Unique supplement names: ${Object.keys(supplementNameMap).length}`);
        
        // Convert to array and sort by most recent first
        const uniqueEntries = Object.values(supplementNameMap).sort((a, b) => b.createdAt - a.createdAt);
        console.log(`👉 Sorted unique entries: ${uniqueEntries.length}`);
        
        // Take the top 10
        const recentUniqueEntries = uniqueEntries.slice(0, 10);
        console.log(`👉 Recent unique entries (top 10): ${recentUniqueEntries.length}`);
        console.log(`👉 Recent entry sample:`, recentUniqueEntries[0] || 'No entries');
        
        setRecentEntries(recentUniqueEntries);
        console.log(`👉 Set recent entries state. Length: ${recentUniqueEntries.length}`);
        
        // Always show the panel, even if empty
        showRecentEntries();
        console.log("👉 Showing history panel");
      })
      .catch(error => {
        console.error('Error fetching recent supplements:', error);
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        }
      });
    
    // Close the fab menu after executing the action
    toggleFabMenu();
  };
  
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

  const renderRecentItem = (entry: SupplementEntry) => {
    console.log(`👉 Rendering recent item: ${entry._id}, name: ${entry.name}`);
    return (
      <ListItem
        key={entry._id}
        title={convertFromDatabaseFormat(entry.name)}
        description={formatTime(entry.createdAt)}
        accessoryRight={() => <Text>{entry.amount} {entry.amount_unit}</Text>}
        onPress={() => {
          console.log(`👉 Pressed recent item: ${entry.name}`);
          // Add a new supplement entry with the same details but current timestamp
          // Note: _id will be created automatically by postSupplement
          const newSupplementData: Supplement = {
            name: entry.name,
            amount: entry.amount,
            createdAt: Math.floor(Date.now() / 1000),
            amount_unit: entry.amount_unit,
          };
          
          postSupplement(newSupplementData)
            .then((newEntry) => {
              console.log(`👉 Created new entry with ID: ${newEntry._id}`);
              showToastInfo(`Added ${convertFromDatabaseFormat(entry.name)}`);
              // First make sure data is loaded fully before hiding the panel
              loadData().then(() => {
                hideRecentEntries();
              });
            })
            .catch(error => {
              console.log('Error: ', error);
              
              if (error instanceof AuthenticationError) {
                handleAuthError(error);
              } else {
                console.error('Error adding supplement from history:', error);
                showToastError('Could not add supplement, try again.');
              }
            });
        }}
      />
    );
  };

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
      
      {/* History Button (animated) */}
      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 90,
            transform: [
              { scale: fabMenuAnimation },
              { 
                translateY: fabMenuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })
              }
            ],
            opacity: fabMenuAnimation
          }
        ]}
      >
        <TouchableOpacity 
          onPress={fetchSupplementHistory}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.fabMenuButton}
          >
            <Icon name='clock-outline' style={styles.fabIcon} fill='white' />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Add Button (animated) */}
      <Animated.View 
        style={[
          styles.fabMenuItem, 
          {
            bottom: 160,
            transform: [
              { scale: fabMenuAnimation },
              { 
                translateY: fabMenuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })
              }
            ],
            opacity: fabMenuAnimation
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => {
            showAddSupplementModal();
            toggleFabMenu();
          }}
        >
          <LinearGradient
            colors={['#444444', '#222222']}
            style={styles.fabMenuButton}
          >
            <Icon name='plus-outline' style={styles.fabIcon} fill='white' />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB button */}
      <TouchableOpacity 
        onPress={toggleFabMenu}
      >
        <LinearGradient
          colors={['#444444', '#222222']}
          style={[styles.fab, isFabMenuOpen ? styles.fabActive : null]}
        >
          <Animated.View style={{
            transform: [
              { 
                rotate: fabMenuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg']
                })
              }
            ]
          }}>
            <Icon name='menu-outline' style={styles.fabIcon} fill='white' />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Recent Entries Slide-up Panel */}
      {recentEntriesVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable 
            style={[styles.closeOverlayArea, { bottom: 0 }]} // Cover full screen
            onPress={hideRecentEntries} 
          />
          <Animated.View 
            style={[
              styles.slideUpPanel, 
              slideUpTransform,
              { 
                backgroundColor: 'white', 
                borderTopLeftRadius: 15, 
                borderTopRightRadius: 15,
                zIndex: 1001 // Higher than the overlay
              }
            ]}
          >
            <View>
              <View style={styles.slideUpHeader}>
                <Text category="h6">Recent Supplements</Text>
              </View>
              <Divider />
              <View style={{minHeight: 220}}>
                <List
                  style={styles.transparentList}
                  data={recentEntries}
                  renderItem={({ item }) => renderRecentItem(item)}
                  ItemSeparatorComponent={Divider}
                  ListEmptyComponent={() => (
                    <Text category="p1" style={styles.emptyHistoryText}>No recent supplement entries</Text>
                  )}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      )}
      
      {/* Add Supplement Slide-up Panel */}
      {modalVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable 
            style={[styles.closeOverlayArea, { bottom: 0 }]} // Cover full screen
            onPress={hideAddSupplementModal} 
          />
          <Animated.View 
            style={[
              styles.slideUpPanel, 
              styles.addSupplementPanel, // Add specific style for the add supplement panel
              addSupplementTransform,
              { 
                backgroundColor: 'white', 
                borderTopLeftRadius: 15, 
                borderTopRightRadius: 15,
                zIndex: 1001 // Higher than the overlay
              }
            ]}
          >
            <View>
              <View style={styles.slideUpHeader}>
                <Text category="h6">Add Supplement</Text>
              </View>
              <Divider />
              
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
                    // Convert IndexPath to number
                    const selectedIndex = typeof index === 'object' ? 
                      Array.isArray(index) ? index[0].row : index.row : 0;
                    const item = dropdownItems[selectedIndex];
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
                  onSelect={(index) => {
                    // Convert IndexPath to number
                    const selectedIndex = typeof index === 'object' ? 
                      Array.isArray(index) ? index[0].row : index.row : 0;
                    setSelectedUnit(options[selectedIndex]);
                  }}
                >
                  {options.map(option => (
                    <SelectItem key={option.value} title={option.label} />
                  ))}
                </Select>
              </View>
              
              <Button style={styles.addButton} onPress={handleAddSupplement}>ADD</Button>
            </View>
          </Animated.View>
        </View>
      )}
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
    marginTop: 0,
    marginBottom: 16,
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  unitSelect: {
    width: 120,
  },
  input: {
    marginBottom: 16,
    marginTop: 8,
  },
  select: {
    marginBottom: 16,
    marginTop: 8,
  },
  listTitle: {
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
    borderWidth: 0,
  },
  fabActive: {
    // No special style needed since we're using gradient
  },
  fabMenuItem: {
    position: 'absolute',
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 998,
  },
  fabMenuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 0,
  },
  fabIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
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
    bottom: 400, // Default height for the panel
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  slideUpPanel: {
    height: 400, // Default height
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  addSupplementPanel: {
    // Remove fixed height to let content determine the size
    minHeight: 300, // Minimum height for the panel
  },
  slideUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transparentList: {
    backgroundColor: 'transparent',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 500,
  },
  buttonIcon: {
    width: 32,
    height: 32,
  },
  emptyHistoryText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default SupplementScreen;

