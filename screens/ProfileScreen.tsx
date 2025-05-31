import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Card, Layout, Button, Text as KittenText } from '@ui-kitten/components';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config';
import { AuthenticationError } from '../errors/NetworkError';
import { showToastError } from '../utils';
import SubscriptionModal from '../components/SubscriptionModal';

// Type for the UI-Kitten props parameter
type KittenProps = {
  style?: any;
  [key: string]: any;
};

// Import the User type instead of defining it locally
import UserType from '../types/User';


const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);




  // Authentication error handler
  const handleAuthError = useCallback(async (error: AuthenticationError) => {
    console.log('Authentication error detected:', error);
    showToastError('Authentication failed. Please log in again.');
    
    // Remove token and user from AsyncStorage
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      console.log('Token and user removed from AsyncStorage');
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (storageError) {
      console.error('Error removing data from storage:', storageError);
      showToastError('Error logging out. Please restart the app.');
    }
  }, [navigation]);
  
  // Handle logout modal cancel
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
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLogoutModalVisible(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to fetch from API
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          // Make API request to fetch user data
          const baseUrl = await getApiBaseUrl();
          const response = await fetch(`${baseUrl}/verify/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            // Update local storage with the latest user data
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          } else if (response.status === 401 || response.status === 403) {
            // Handle authentication errors explicitly
            throw new AuthenticationError(`Authentication failed with status code ${response.status}`);
          } else {
            // If API call fails for other reasons, fall back to local storage
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          }
        } else {
          // No token, try local storage
          const userData = await AsyncStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        
        if (error instanceof AuthenticationError) {
          handleAuthError(error);
        } else {
          // If network error, try local storage as fallback
          try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              console.log('userData: ', userData);
              setUser(JSON.parse(userData));
            }
          } catch (localError) {
            console.error('Error loading local user data:', localError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [handleAuthError]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3366FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Layout style={styles.profileContainer}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>
          
          {user.premium !== undefined && (
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Account Type</Text>
              <Text style={styles.value}>{user.premium ? 'Premium' : 'Free'}</Text>
            </View>
          )}

          {user.created_at && (
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}

          {user.last_login && (
            <View style={styles.infoContainer}>
              <Text style={styles.label}>Last Login</Text>
              <Text style={styles.value}>
                {new Date(user.last_login).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={['#444444', '#222222']}
              style={styles.gradientContainer}
            >
              <Button
                appearance="filled"
                size="large"
                onPress={() => navigation.navigate('PrivacyPolicy')}
                style={[styles.menuButton, { backgroundColor: 'transparent' }]}
              >
                {(evaProps: KittenProps) => <KittenText {...evaProps} style={styles.buttonText}>Privacy Policy</KittenText>}
              </Button>
            </LinearGradient>
          </View>
          
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={['#ff6b6b', '#ff5252']}
              style={styles.gradientContainer}
            >
              <Button
                appearance="filled"
                size="large"
                onPress={() => setLogoutModalVisible(true)}
                style={[styles.menuButton, { backgroundColor: 'transparent' }]}
              >
                {(evaProps: KittenProps) => <KittenText {...evaProps} style={styles.buttonText}>Logout</KittenText>}
              </Button>
            </LinearGradient>
          </View>
          
          {!user.premium && (
            <View style={styles.buttonContainer}>
              <LinearGradient
                colors={['#3366FF', '#1144CC']}
                style={styles.gradientContainer}
              >
                <Button
                  appearance="filled"
                  size="large"
                  onPress={() => setModalVisible(true)}
                  style={[styles.menuButton, { backgroundColor: 'transparent' }]}
                >
                  {(evaProps: KittenProps) => (
                    <KittenText {...evaProps} style={styles.buttonText}>
                      Upgrade to Premium
                    </KittenText>
                  )}
                </Button>
              </LinearGradient>
            </View>
          )}
        </Card>
      </Layout>

      <SubscriptionModal
        visible={modalVisible}
        setVisible={setModalVisible}
        user={user}
        setUser={setUser}
        onAuthError={handleAuthError}
      />
      
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
            <Text style={styles.logoutModalTitle}>Logout</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8F9BB3',
  },
  profileContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 8,
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#8F9BB3',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  subscriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF1F7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subscriptionOption: {
    borderWidth: 1,
    borderColor: '#EDF1F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subscriptionPrice: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  trialText: {
    fontSize: 13,
    color: '#00FF7F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  androidSubscriptionText: {
    fontSize: 14,
    color: 'white',
    marginTop: 6,
  },
  buttonContainer: {
    marginVertical: 8,
    width: '100%',
  },
  gradientContainer: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  menuButton: {
    height: 60,
    borderRadius: 15,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalButtonContainer: {
    marginBottom: 10,
  },
  // Logout modal styles
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
  logoutModalTitle: {
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
  buttonLogoutText: {
    color: 'white',
  },
});

export default ProfileScreen;
