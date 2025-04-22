import React, { useState, useRef, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, OverflowMenu, MenuItem, TopNavigationAction } from '@ui-kitten/components';
import Menu from '../components/Menu';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const menuItems = [
  {
    label: "Exercise",
    screenName: "Exercise",
  },
  {
    label: "Diet",
    screenName: "Diet",
  },
  {
    label: "Weight",
    screenName: "Weight",
  },
  {
    label: "Supplements",
    screenName: "Supplement",
  },
]

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Handle menu visibility
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  
  // Handle logout button press
  const handleLogoutPress = () => {
    console.log('Logout button pressed');
    setMenuVisible(false);
    setLogoutModalVisible(true);
  };
  
  // Handle modal cancel
  const handleCancelLogout = () => {
    setLogoutModalVisible(false);
  };
  
  // Perform the actual logout
  const handleLogout = async () => {
    console.log('Performing logout...');
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.multiRemove(['user', 'token']);
      console.log('User logged out successfully');
      
      // Navigate to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLogoutModalVisible(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Menu 
          menuItems={menuItems}
          navigation={navigation}
        />
      </View>
      
      {/* Logout confirmation modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={handleCancelLogout}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelLogout}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.buttonCancel]}
                onPress={handleCancelLogout}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.button, styles.buttonLogout]}
                onPress={handleLogout}
              >
                <Text style={[styles.buttonText, styles.buttonLogoutText]}>
                  Logout
                </Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    maxWidth: 400,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    color: '#555',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#f0f0f0',
  },
  buttonLogout: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonLogoutText: {
    color: 'white',
  },
});
// Create a logout handler function that can be used in the header
export const handleLogout = async (navigation: NavigationProp<any>) => {
  try {
    // Clear user data from AsyncStorage
    await AsyncStorage.multiRemove(['user', 'token']);
    console.log('User logged out successfully');
    
    // Navigate to Login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Header Right component with dropdown menu
export const HomeScreenHeaderRight: React.FC<{ navigation: NavigationProp<any> }> = ({ navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  
  const handleLogout = useCallback(() => {
    setMenuVisible(false);
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      AsyncStorage.multiRemove(['user', 'token'])
        .then(() => console.log('User logged out successfully'))
        .catch(error => console.error('Error during logout:', error));
    }, 100);
  }, [navigation]);
  
  const renderMenuAction = () => (
    <TopNavigationAction
      icon={(props) => (
        <Icon
          {...props}
          name="more-vertical-outline"
          fill="#000"
        />
      )}
      onPress={() => setMenuVisible(true)}
    />
  );
  
  const navigateToProfile = () => {
    setMenuVisible(false);
    navigation.navigate('Profile');
  };
  
  return (
    <OverflowMenu
      anchor={renderMenuAction}
      visible={menuVisible}
      onBackdropPress={() => setMenuVisible(false)}
      placement="bottom end"
    >
      <MenuItem
        title="Profile"
        accessoryLeft={(props) => <Icon {...props} name="person-outline" />}
        onPress={navigateToProfile}
      />
      <MenuItem
        title="Logout"
        accessoryLeft={(props) => <Icon {...props} name="log-out-outline" fill="#ff6b6b" />}
        onPress={handleLogout}
      />
    </OverflowMenu>
  );
};

export default HomeScreen;
