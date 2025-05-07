import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable,
  ScrollView,
  TouchableOpacity,
  Platform,
  Keyboard,
  Alert
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
  Divider,
  Datepicker,
  IconProps,
  TopNavigation,
  TopNavigationAction
} from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import { getSupplement, getSupplementNames, postSupplement, deleteSupplement } from '../network/supplement';
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementEntry | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  
  // Reference to the amount input field
  const amountInputRef = useRef<any>(null);
  
  // Animation state for Recent Entries panel
  const [recentEntriesVisible, setRecentEntriesVisible] = useState<boolean>(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  
  // Animation state for Add Supplement panel
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const addSupplementAnim = useState(new Animated.Value(0))[0];
  const modalPosition = useState(new Animated.Value(0))[0];
  
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
    // First set modal visible
    setModalVisible(true);
    
    // Then animate it in
    Animated.timing(addSupplementAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // After animation starts, ensure the keyboard stays up
    // Reduced timeout for quicker focus to prevent modal from being behind keyboard
    setTimeout(() => {
      if (selectedItem?.value === 'new_supplement' && newSupplementName === '') {
        // If user needs to enter a new supplement name, focus there
        // This will be handled by autoFocus
      } else if (amountInputRef.current && amount === '') {
        // Otherwise focus the amount field if empty
        amountInputRef.current.focus();
      }
    }, 300); // Reduced from 500ms to 300ms for faster focus
  };
  
  // Function to hide the add supplement slide-up panel
  const hideAddSupplementModal = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    // Then animate the panel closing
    Animated.timing(addSupplementAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };
  
  // Function to show the supplement details modal
  const showSupplementDetails = (supplement: SupplementEntry) => {
    setSelectedSupplement(supplement);
    setDetailsModalVisible(true);
  };
  
  // Function to hide the supplement details modal
  const hideSupplementDetails = () => {
    setDetailsModalVisible(false);
    setSelectedSupplement(null);
  };
  
  // Function to handle supplement deletion
  const handleDeleteSupplement = () => {
    if (!selectedSupplement) return;
    
    Alert.alert(
      "Delete Supplement",
      `Are you sure you want to delete ${convertFromDatabaseFormat(selectedSupplement.name)}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSupplement(selectedSupplement._id);
              showToastInfo(`Deleted ${convertFromDatabaseFormat(selectedSupplement.name)}`);
              hideSupplementDetails();
              await loadData(); // Refresh the list
            } catch (error) {
              console.error('Error deleting supplement:', error);
              
              if (error instanceof AuthenticationError) {
                handleAuthError(error);
              } else {
                showToastError('Could not delete supplement. Please try again.');
              }
            }
          }
        }
      ]
    );
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
    // Get start of selected day in Unix time
    const startOfDay = getSelectedDayUnixTime(selectedDate);
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
  
  // Helper function to get the Unix time for the start of the selected date
  const getSelectedDayUnixTime = (date: Date): number => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return Math.floor(newDate.getTime() / 1000);
  }
  
  // Date navigation functions
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  // Calendar icon for DatePicker
  const CalendarIcon = (props?: IconProps) => (
    <Icon {...props} name='calendar-outline'/>
  );
  
  // Arrow icons for date navigation
  const LeftArrowIcon = (props?: IconProps) => (
    <Icon {...props} name='arrow-back-outline'/>
  );
  
  const RightArrowIcon = (props?: IconProps) => (
    <Icon {...props} name='arrow-forward-outline'/>
  );
  
  // Icons for details modal
  const CloseIcon = (props?: IconProps) => (
    <Icon {...props} name='close-outline'/>
  );
  
  const TrashIcon = (props?: IconProps) => (
    <Icon {...props} name='trash-outline' fill='#FF3D71'/>
  );

  useEffect(() => {
    if (modalVisible === false) {
      // Reset form fields when modal is fully hidden
      setTimeout(() => {
        setSelectedItem(undefined);
        setAmount("");
      }, 300); // Match the animation duration
    }
  }, [modalVisible]);
  
  // Handle keyboard showing/hiding with improved implementation for modal visibility
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // When keyboard shows, animate modal to move up to ensure it's fully visible
        // Adding extra padding to ensure the bottom of the modal is visible
        const keyboardHeight = e.endCoordinates.height;
        const safeOffset = keyboardHeight + 20; // 20px extra padding for better visibility
        
        Animated.timing(modalPosition, {
          toValue: -safeOffset,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // When keyboard hides, animate modal back to original position
        Animated.timing(modalPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [modalPosition]);

  // Load data when component mounts
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
  
  // Reload data when selected date changes
  useEffect(() => {
    loadData()
      .catch(err => {
        console.error('Error reloading data for new date:', err);
        if (err instanceof AuthenticationError) {
          handleAuthError(err);
        }
      });
  }, [selectedDate]);

  const handleAddSupplement = async (_e: any) => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount)) {
      const supplementName = selectedItem?.value === 'new_supplement' ? convertToDatabaseFormat(newSupplementName) : selectedItem?.value;
      if (supplementName) {
        try {
          // Use the selected date timestamp instead of current time
          const timestamp = Math.floor(new Date(selectedDate).getTime() / 1000);
          
          await postSupplement({
            name: supplementName,
            amount: parsedAmount,
            createdAt: timestamp,
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
        // Initial animation to slide in from bottom
        translateY: addSupplementAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0], // Slide up animation
        }),
      },
      {
        // Additional animation to adjust for keyboard
        translateY: modalPosition,
      }
    ],
    // Ensure the modal doesn't get cut off at the bottom
    maxHeight: Dimensions.get('window').height * 0.8,
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
      onPress={() => showSupplementDetails(item)}
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
      {/* Date picker header */}
      <View style={styles.datePickerContainer}>
        <Button
          appearance="ghost"
          accessoryLeft={LeftArrowIcon}
          onPress={goToPreviousDay}
          style={styles.dateNavButton}
        />
        <View style={styles.datePickerWrapper}>
          <Datepicker
            date={selectedDate}
            onSelect={setSelectedDate}
            accessoryLeft={CalendarIcon}
            style={styles.datePicker}
          />
        </View>
        <Button
          appearance="ghost"
          accessoryLeft={RightArrowIcon}
          onPress={goToNextDay}
          style={styles.dateNavButton}
        />
      </View>
      
      {supplementEntries.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text category="h6" appearance="hint">No supplements taken on this day</Text>
        </View>
      ) : (
        <Card style={styles.card}>
          <Text category="h6" style={styles.listTitle}>Supplements for {selectedDate.toLocaleDateString()}</Text>
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
      <View style={styles.mainFabContainer}>
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
      </View>
      
      {/* Recent Entries Slide-up Panel */}
      {recentEntriesVisible && (
        <View style={styles.slideUpOverlay}>
          <Pressable 
            style={styles.closeOverlayArea}
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
            style={styles.closeOverlayArea}
            onPress={hideAddSupplementModal} 
          />
          
            <Animated.View 
              style={[
                styles.slideUpPanel, 
                styles.addSupplementPanel,
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
                    returnKeyType="next"
                    autoFocus={true}
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
                      
                      // Focus the amount input after selection
                      if (item.value !== 'new_supplement') {
                        // Add a delay to make sure focus happens after dropdown closes
                        setTimeout(() => {
                          if (amountInputRef.current) {
                            amountInputRef.current.focus();
                          }
                        }, 300);
                      }
                    }}
                  >
                    {dropdownItems.map(item => (
                      <SelectItem key={item.value} title={item.label} />
                    ))}
                  </Select>
                )}
                
                <View style={styles.amountContainer}>
                  <Input
                    ref={amountInputRef}
                    style={styles.amountInput}
                    placeholder="Amount"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleAddSupplement}
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
                      
                      // Re-focus the amount input after unit selection with longer delay
                      setTimeout(() => {
                        if (amountInputRef.current) {
                          amountInputRef.current.focus();
                        }
                      }, 300); // Longer delay for more reliable focus
                    }}
                  >
                    {options.map(option => (
                      <SelectItem key={option.value} title={option.label} />
                    ))}
                  </Select>
                </View>
                
                <LinearGradient
                  colors={['#444444', '#222222']}
                  style={styles.gradientContainer}
                >
                  <Button 
                    style={[styles.addButton, { backgroundColor: 'transparent' }]} 
                    onPress={handleAddSupplement}
                    appearance="filled"
                    size="large"
                  >
                    {(evaProps: any) => <Text {...evaProps} style={styles.buttonText}>ADD</Text>}
                  </Button>
                </LinearGradient>
              </View>
            </Animated.View>
        </View>
      )}
      
      {/* Supplement Details Modal */}
      <Modal
        visible={detailsModalVisible}
        backdropStyle={styles.backdrop}
        onBackdropPress={hideSupplementDetails}
        style={styles.detailsModal}
      >
        {selectedSupplement && (
          <Card style={styles.detailsCard} disabled={true}>
            <View style={styles.detailsHeader}>
              <Text category="h5">{convertFromDatabaseFormat(selectedSupplement.name)}</Text>
              <Button
                appearance="ghost"
                status="basic"
                accessoryLeft={CloseIcon}
                onPress={hideSupplementDetails}
                style={styles.closeButton}
              />
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text category="s1">Amount:</Text>
                <Text category="p1">{selectedSupplement.amount} {selectedSupplement.amount_unit}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text category="s1">Time:</Text>
                <Text category="p1">{formatTime(selectedSupplement.createdAt)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text category="s1">Date:</Text>
                <Text category="p1">{new Date(selectedSupplement.createdAt * 1000).toLocaleDateString()}</Text>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <Button
              appearance="ghost"
              status="danger"
              accessoryLeft={TrashIcon}
              onPress={handleDeleteSupplement}
            >
              DELETE
            </Button>
          </Card>
        )}
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerWrapper: {
    marginHorizontal: 10,
  },
  datePicker: {
    borderRadius: 8,
    width: 160,
  },
  dateNavButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  gradientContainer: {
    marginTop: 8,
    marginBottom: 12, // Add some bottom margin for spacing
    borderRadius: 15,
    overflow: 'hidden',
  },
  addButton: {
    marginTop: 8,
    height: 50,
    borderRadius: 15,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  mainFabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    zIndex: 999,
  },
  fab: {
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
    bottom: 0, // Cover the full screen
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  slideUpPanel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  addSupplementPanel: {
    // Set the panel to fit its content
    height: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,  // Increased padding at bottom for better visibility with keyboard
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
  // Supplement details modal styles
  detailsModal: {
    width: '90%',
    maxWidth: 400,
  },
  detailsCard: {
    borderRadius: 10,
    padding: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    padding: 0,
  },
  divider: {
    marginVertical: 12,
  },
  detailsContent: {
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default SupplementScreen;

