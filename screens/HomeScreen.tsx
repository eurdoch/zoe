import React, { useState, useRef, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, View, Text, Modal, Pressable, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, OverflowMenu, MenuItem, TopNavigationAction } from '@ui-kitten/components';
import Menu from '../components/Menu';
import SubscriptionModal from '../components/SubscriptionModal';
import { checkPremiumStatus } from '../network/user';
import { AuthenticationError } from '../errors/NetworkError';
import UserType from '../types/User';

type HomeScreenProps = {
  navigation: NavigationProp<any>;
};

const menuItems = [
  {
    label: "Lifts",
    screenName: "Exercise",
  },
  {
    label: "Macros",
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
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  
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
  
  // Calculate trial end date (2 weeks from now)
  const getTrialEndDate = () => {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    return trialEndDate.toLocaleDateString();
  };

  // Handle menu item press
  const handleMenuItemPress = async (item: { screenName: string; label: string; data?: any }) => {
    // Check if the Diet option was pressed
    if (item.screenName === 'Diet') {
      try {
        // Get token from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          // Navigate to login if no token is available
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
        
        // Check premium status
        const premiumStatus = await checkPremiumStatus(token);
        
        if (!premiumStatus.premium) {
          // User is not premium, show subscription modal
          setSubscriptionModalVisible(true);
          return;
        }
        
        // If user is premium, proceed to Diet screen
        navigation.navigate(item.screenName, { data: item.data });
      } catch (error) {
        console.error('Error checking premium status:', error);
        
        if (error instanceof AuthenticationError) {
          // Handle authentication error - redirect to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else {
          // Show generic error message
          Alert.alert(
            'Error',
            'Unable to verify premium status. Please try again later.',
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
      }
    } else {
      // For other screens, navigate normally
      navigation.navigate(item.screenName, { data: item.data });
    }
  };
  
  // Authentication error handler
  const handleAuthError = useCallback(async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    
    // Remove token and user from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Token and user removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (storageError) {
      console.error('Error removing data from storage:', storageError);
    }
  }, [navigation]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Menu 
          menuItems={menuItems}
          navigation={navigation}
          onItemPress={handleMenuItemPress}
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
      
      <SubscriptionModal
        visible={subscriptionModalVisible}
        setVisible={setSubscriptionModalVisible}
        user={user}
        setUser={setUser}
        onAuthError={handleAuthError}
        premiumFeatureMessage={`Diet tracking is a premium feature. Upgrade to access macro tracking, nutrition analysis, and detailed meal logging. Start with a 2-week free trial - you'll be charged on ${getTrialEndDate()}.`}
      />
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
