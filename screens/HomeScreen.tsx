import React, { useState, useLayoutEffect } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Menu from '../components/Menu';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { SYNC_ENABLED } from '../config';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const menuItems = [
  {
    label: "exercise",
    screenName: "Exercise",
  },
  // TODO broken for now
  //{
  //  label: "Diet",
  //  screenName: "Diet",
  //},
  {
    label: "weight",
    screenName: "Weight",
  },
  {
    label: "supplements",
    screenName: "Supplement",
  },
]

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  // Handle logout button press
  const handleLogoutPress = () => {
    console.log('Logout button pressed');
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
      await AsyncStorage.multiRemove(['user', 'token', 'currentUser']);
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
  
  // Set header right button with text instead of icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleLogoutPress}
          style={{ marginRight: 10 }}
        >
          <Text style={{ 
            color: '#7CDB8A', 
            fontSize: 16,
            fontWeight: '600',
            padding: 8
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Menu 
          menuItems={menuItems}
          navigation={navigation}
        />
        
        {/* Show sync status indicator only if sync is enabled */}
        {SYNC_ENABLED && <SyncStatusIndicator />}
      </View>
    
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
export default HomeScreen;
